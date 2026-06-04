from datetime import datetime, timezone
from typing import Annotated, Optional

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import asc as sa_asc, desc as sa_desc, or_
from sqlmodel import Session, select, func

from app.database import get_session
from app.dependencies.auth import AdminUser
from app.models.user import User, UserRole
from app.models.seller import Seller
from app.models.part import Part, PartCategory, PartCompatibility, PartImage
from app.models.vehicle import Make, Model as VehicleModel, ModelYear
from app.config import settings
from app.schemas.user import UserRead, UserUpdate
from app.schemas.seller import SellerUpdate
from app.schemas.part import PartCategoryCreate, PartCategoryUpdate
from app.services.auth_service import assign_seller_role, revoke_seller_role, get_user_by_id, build_token_response
from app.schemas.user import TokenResponse

router = APIRouter()

DBSession = Annotated[Session, Depends(get_session)]


# ── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(admin: AdminUser, session: DBSession):
    user_count = session.exec(select(func.count()).select_from(User)).one()
    seller_count = session.exec(select(func.count()).select_from(Seller)).one()
    part_count = session.exec(select(func.count()).select_from(Part)).one()
    return {"users": user_count, "sellers": seller_count, "parts": part_count}


# ── Users ─────────────────────────────────────────────────────────────────────

class UserAdminRead(BaseModel):
    id: int
    email: str
    username: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    seller_id: Optional[int] = None

    class Config:
        from_attributes = True


_USER_SORT_COLS = {"created_at", "username", "full_name", "email", "role"}


@router.get("/users")
def list_users(
    admin: AdminUser,
    session: DBSession,
    search: str = "",
    role: str = "",
    is_active: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    page: int = 1,
    limit: int = 50,
):
    if sort_by not in _USER_SORT_COLS:
        sort_by = "created_at"

    filters = []
    if search:
        q = f"%{search}%"
        filters.append(
            or_(
                User.email.ilike(q),
                User.username.ilike(q),
                User.full_name.ilike(q),
            )
        )
    if role:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active == is_active)

    base = select(User)
    count_q = select(func.count()).select_from(User)
    for f in filters:
        base = base.where(f)
        count_q = count_q.where(f)

    total = session.exec(count_q).one()

    order_fn = sa_asc if sort_dir == "asc" else sa_desc
    base = base.order_by(order_fn(getattr(User, sort_by)))
    users = session.exec(base.offset((page - 1) * limit).limit(limit)).all()

    user_ids = [u.id for u in users]
    sellers = session.exec(select(Seller).where(Seller.user_id.in_(user_ids))).all() if user_ids else []
    seller_map = {s.user_id: s.id for s in sellers}

    items = [
        {
            "id": u.id,
            "email": u.email,
            "username": u.username,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "seller_id": seller_map.get(u.id),
        }
        for u in users
    ]
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, admin: AdminUser, session: DBSession):
    user = get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(user_id: int, data: UserUpdate, admin: AdminUser, session: DBSession):
    user = get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role is not None:
        user.role = data.role

    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, admin: AdminUser, session: DBSession):
    user = get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()


# ── Seller role management ────────────────────────────────────────────────────

class AssignSellerRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    business_name: Optional[str] = None
    city: Optional[str] = None
    is_business: bool = False


@router.post("/users/{user_id}/make-seller", response_model=UserRead)
def make_seller(user_id: int, data: AssignSellerRequest, admin: AdminUser, session: DBSession):
    user = get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        assign_seller_role(session, user, data.model_dump(exclude_none=True))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    session.refresh(user)
    return user


@router.post("/users/{user_id}/impersonate", response_model=TokenResponse)
def impersonate_user(user_id: int, admin: AdminUser, session: DBSession):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot impersonate yourself")
    user = get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User is inactive")
    return build_token_response(user)


@router.delete("/users/{user_id}/make-seller", response_model=UserRead)
def revoke_seller(user_id: int, admin: AdminUser, session: DBSession):
    user = get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    revoke_seller_role(session, user)
    session.refresh(user)
    return user


# ── Sellers ───────────────────────────────────────────────────────────────────

class SellerAdminRead(BaseModel):
    id: int
    user_id: Optional[int]
    username: Optional[str] = None
    name: str
    phone: Optional[str]
    email: Optional[str]
    business_name: Optional[str]
    address: Optional[str]
    city: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    is_business: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


_SELLER_SORT_COLS = {"created_at", "name", "business_name", "city"}


@router.get("/sellers")
def list_sellers(
    admin: AdminUser,
    session: DBSession,
    search: str = "",
    is_verified: Optional[bool] = None,
    is_business: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    page: int = 1,
    limit: int = 50,
):
    if sort_by not in _SELLER_SORT_COLS:
        sort_by = "created_at"

    filters = []
    if search:
        q = f"%{search}%"
        filters.append(
            or_(
                Seller.name.ilike(q),
                Seller.business_name.ilike(q),
                Seller.city.ilike(q),
                Seller.email.ilike(q),
                Seller.phone.ilike(q),
            )
        )
    if is_verified is not None:
        filters.append(Seller.is_verified == is_verified)
    if is_business is not None:
        filters.append(Seller.is_business == is_business)

    base = select(Seller)
    count_q = select(func.count()).select_from(Seller)
    for f in filters:
        base = base.where(f)
        count_q = count_q.where(f)

    total = session.exec(count_q).one()

    order_fn = sa_asc if sort_dir == "asc" else sa_desc
    base = base.order_by(order_fn(getattr(Seller, sort_by)))
    sellers = session.exec(base.offset((page - 1) * limit).limit(limit)).all()

    user_ids = [s.user_id for s in sellers if s.user_id]
    users = session.exec(select(User).where(User.id.in_(user_ids))).all() if user_ids else []
    user_map = {u.id: u.username for u in users}

    items = [
        {
            "id": s.id,
            "user_id": s.user_id,
            "username": user_map.get(s.user_id) if s.user_id else None,
            "name": s.name,
            "phone": s.phone,
            "email": s.email,
            "business_name": s.business_name,
            "address": s.address,
            "city": s.city,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "is_business": s.is_business,
            "is_verified": s.is_verified,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
        }
        for s in sellers
    ]
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.patch("/sellers/{seller_id}", response_model=SellerAdminRead)
def update_seller(seller_id: int, data: SellerUpdate, admin: AdminUser, session: DBSession):
    seller = session.get(Seller, seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(seller, field, val)
    seller.updated_at = datetime.now(timezone.utc)
    session.add(seller)
    session.commit()
    session.refresh(seller)
    # Re-fetch username for response
    username = None
    if seller.user_id:
        user = session.get(User, seller.user_id)
        username = user.username if user else None
    return {
        "id": seller.id,
        "user_id": seller.user_id,
        "username": username,
        "name": seller.name,
        "phone": seller.phone,
        "email": seller.email,
        "business_name": seller.business_name,
        "address": seller.address,
        "city": seller.city,
        "latitude": seller.latitude,
        "longitude": seller.longitude,
        "is_business": seller.is_business,
        "is_verified": seller.is_verified,
        "created_at": seller.created_at,
        "updated_at": seller.updated_at,
    }


@router.patch("/sellers/{seller_id}/verify")
def verify_seller(seller_id: int, admin: AdminUser, session: DBSession):
    seller = session.get(Seller, seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    seller.is_verified = True
    seller.updated_at = datetime.now(timezone.utc)
    session.add(seller)
    session.commit()
    return {"ok": True}


@router.patch("/sellers/{seller_id}/unverify")
def unverify_seller(seller_id: int, admin: AdminUser, session: DBSession):
    seller = session.get(Seller, seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    seller.is_verified = False
    seller.updated_at = datetime.now(timezone.utc)
    session.add(seller)
    session.commit()
    return {"ok": True}


# ── Parts ─────────────────────────────────────────────────────────────────────

class CompatVehicleAdminInput(BaseModel):
    model_year_id: int
    specific_year: Optional[int] = None


class PartAdminUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    condition: Optional[str] = None
    status: Optional[str] = None
    oem_number: Optional[str] = None
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category_id: Optional[int] = None
    compatible_vehicles: Optional[list[CompatVehicleAdminInput]] = None


_SORT_COLS = {"created_at", "price", "title", "status", "condition"}


@router.get("/parts")
def list_parts(
    admin: AdminUser,
    session: DBSession,
    search: str = "",
    status: str = "",
    condition: str = "",
    category_id: Optional[int] = None,
    vehicle_search: str = "",
    location_search: str = "",
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    page: int = 1,
    limit: int = 50,
):
    if sort_by not in _SORT_COLS:
        sort_by = "created_at"

    filters = []
    if search:
        q = f"%{search}%"
        seller_subq = select(Seller.id).where(
            or_(Seller.name.ilike(q), Seller.business_name.ilike(q))
        )
        filters.append(
            or_(
                Part.title.ilike(q),
                Part.oem_number.ilike(q),
                Part.location_text.ilike(q),
                Part.seller_id.in_(seller_subq),
            )
        )
    if status:
        filters.append(Part.status == status)
    if condition:
        filters.append(Part.condition == condition)
    if category_id is not None:
        filters.append(Part.category_id == category_id)
    if vehicle_search:
        vs = f"%{vehicle_search}%"
        vehicle_subq = (
            select(PartCompatibility.part_id)
            .join(ModelYear, PartCompatibility.model_year_id == ModelYear.id)
            .join(VehicleModel, ModelYear.model_id == VehicleModel.id)
            .join(Make, VehicleModel.make_id == Make.id)
            .where(or_(Make.name.ilike(vs), VehicleModel.name.ilike(vs)))
        )
        filters.append(Part.id.in_(vehicle_subq))
    if location_search:
        filters.append(Part.location_text.ilike(f"%{location_search}%"))

    base = select(Part)
    count_q = select(func.count()).select_from(Part)
    for f in filters:
        base = base.where(f)
        count_q = count_q.where(f)

    total = session.exec(count_q).one()

    order_fn = sa_asc if sort_dir == "asc" else sa_desc
    base = base.order_by(order_fn(getattr(Part, sort_by)))

    parts = session.exec(base.offset((page - 1) * limit).limit(limit)).all()

    part_ids = [p.id for p in parts]
    seller_ids = list({p.seller_id for p in parts})
    sellers = session.exec(select(Seller).where(Seller.id.in_(seller_ids))).all() if seller_ids else []
    seller_map = {s.id: s for s in sellers}
    cat_ids = list({p.category_id for p in parts if p.category_id})
    cats = session.exec(select(PartCategory).where(PartCategory.id.in_(cat_ids))).all() if cat_ids else []
    category_map = {c.id: c.name for c in cats}
    images = session.exec(
        select(PartImage).where(PartImage.part_id.in_(part_ids)).order_by(PartImage.part_id, PartImage.sort_order)
    ).all() if part_ids else []
    image_map: dict[int, str] = {}
    for img in images:
        if img.part_id not in image_map:
            image_map[img.part_id] = img.url

    compat_labels: dict[int, list[str]] = {}
    if part_ids:
        compat_rows = session.exec(
            select(PartCompatibility).where(PartCompatibility.part_id.in_(part_ids))
        ).all()
        if compat_rows:
            my_ids = list({c.model_year_id for c in compat_rows})
            my_rows = session.exec(select(ModelYear).where(ModelYear.id.in_(my_ids))).all()
            my_map = {my.id: my for my in my_rows}
            vmodel_ids = list({my.model_id for my in my_rows})
            vmodel_rows = session.exec(select(VehicleModel).where(VehicleModel.id.in_(vmodel_ids))).all()
            vmodel_map = {m.id: m for m in vmodel_rows}
            make_ids = list({m.make_id for m in vmodel_rows})
            make_rows = session.exec(select(Make).where(Make.id.in_(make_ids))).all()
            make_map = {mk.id: mk for mk in make_rows}
            for c in compat_rows:
                my = my_map.get(c.model_year_id)
                if not my:
                    continue
                vmodel = vmodel_map.get(my.model_id)
                if not vmodel:
                    continue
                make = make_map.get(vmodel.make_id)
                if not make:
                    continue
                compat_labels.setdefault(c.part_id, []).append(f"{make.name} {vmodel.name}")

    def _vehicle_label(part_id: int) -> str | None:
        labels = compat_labels.get(part_id, [])
        if not labels:
            return None
        unique = list(dict.fromkeys(labels))
        return unique[0] if len(unique) == 1 else f"{unique[0]} +{len(unique) - 1}"

    items = [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "price": p.price,
            "currency": p.currency,
            "status": p.status,
            "condition": p.condition,
            "oem_number": p.oem_number,
            "location_text": p.location_text,
            "seller_id": p.seller_id,
            "seller_name": seller_map[p.seller_id].business_name or seller_map[p.seller_id].name if p.seller_id in seller_map else None,
            "category_name": category_map.get(p.category_id) if p.category_id else None,
            "created_at": p.created_at,
            "primary_image_url": image_map.get(p.id),
            "vehicle_label": _vehicle_label(p.id),
        }
        for p in parts
    ]
    return {"items": items, "total": total, "page": page, "limit": limit}


def _category_dict(c: PartCategory) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "slug": c.slug,
        "parent_id": c.parent_id,
        "icon": c.icon,
        "image_url": c.image_url,
        "sort_order": c.sort_order,
    }


@router.get("/categories")
def list_categories(admin: AdminUser, session: DBSession):
    cats = session.exec(select(PartCategory).order_by(PartCategory.sort_order, PartCategory.name)).all()
    return [_category_dict(c) for c in cats]


@router.post("/categories", status_code=status.HTTP_201_CREATED)
def create_category(data: PartCategoryCreate, admin: AdminUser, session: DBSession):
    if session.exec(select(PartCategory).where(PartCategory.slug == data.slug)).first():
        raise HTTPException(status_code=409, detail="Slug already exists")
    cat = PartCategory(
        name=data.name,
        slug=data.slug,
        parent_id=data.parent_id,
        icon=data.icon,
        sort_order=data.sort_order,
    )
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return _category_dict(cat)


@router.patch("/categories/{cat_id}")
def update_category(cat_id: int, data: PartCategoryUpdate, admin: AdminUser, session: DBSession):
    cat = session.get(PartCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if data.slug and data.slug != cat.slug:
        if session.exec(select(PartCategory).where(PartCategory.slug == data.slug)).first():
            raise HTTPException(status_code=409, detail="Slug already exists")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(cat, field, val)
    cat.updated_at = datetime.now(timezone.utc)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return _category_dict(cat)


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(cat_id: int, admin: AdminUser, session: DBSession):
    cat = session.get(PartCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    has_parts = session.exec(select(func.count()).select_from(Part).where(Part.category_id == cat_id)).one()
    if has_parts:
        raise HTTPException(status_code=409, detail="Category has parts assigned to it")
    has_children = session.exec(select(func.count()).select_from(PartCategory).where(PartCategory.parent_id == cat_id)).one()
    if has_children:
        raise HTTPException(status_code=409, detail="Category has subcategories")
    if cat.image_url:
        filename = cat.image_url.split("/")[-1]
        file_path = Path(settings.upload_dir) / filename
        if file_path.exists():
            file_path.unlink()
    session.delete(cat)
    session.commit()


@router.post("/categories/{cat_id}/image")
async def upload_category_image(cat_id: int, admin: AdminUser, session: DBSession, file: UploadFile = File(...)):
    cat = session.get(PartCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Remove old image if exists
    if cat.image_url:
        old_path = upload_dir / cat.image_url.split("/")[-1]
        if old_path.exists():
            old_path.unlink()

    ext = Path(file.filename or "img.jpg").suffix
    unique_name = f"cat_{uuid.uuid4().hex}{ext}"
    file_path = upload_dir / unique_name
    file_path.write_bytes(await file.read())

    cat.image_url = f"/uploads/{unique_name}"
    cat.updated_at = datetime.now(timezone.utc)
    session.add(cat)
    session.commit()
    session.refresh(cat)
    return _category_dict(cat)


@router.delete("/categories/{cat_id}/image", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_image(cat_id: int, admin: AdminUser, session: DBSession):
    cat = session.get(PartCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    if cat.image_url:
        file_path = Path(settings.upload_dir) / cat.image_url.split("/")[-1]
        if file_path.exists():
            file_path.unlink()
        cat.image_url = None
        cat.updated_at = datetime.now(timezone.utc)
        session.add(cat)
        session.commit()


@router.patch("/parts/{part_id}")
def update_part(part_id: int, data: PartAdminUpdate, admin: AdminUser, session: DBSession):
    part = session.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    dump = data.model_dump(exclude_unset=True)
    compat_vehicles = dump.pop("compatible_vehicles", None)
    for field, val in dump.items():
        setattr(part, field, val)

    if compat_vehicles is not None:
        existing = session.exec(select(PartCompatibility).where(PartCompatibility.part_id == part_id)).all()
        for c in existing:
            session.delete(c)
        session.flush()
        for v in compat_vehicles:
            session.add(PartCompatibility(part_id=part_id, model_year_id=v["model_year_id"], specific_year=v.get("specific_year")))

    part.updated_at = datetime.now(timezone.utc)
    session.add(part)
    session.commit()
    session.refresh(part)
    seller = session.get(Seller, part.seller_id)
    category = session.get(PartCategory, part.category_id) if part.category_id else None
    return {
        "id": part.id,
        "title": part.title,
        "description": part.description,
        "price": part.price,
        "currency": part.currency,
        "status": part.status,
        "condition": part.condition,
        "oem_number": part.oem_number,
        "location_text": part.location_text,
        "seller_id": part.seller_id,
        "seller_name": (seller.business_name or seller.name) if seller else None,
        "category_name": category.name if category else None,
        "created_at": part.created_at,
        "primary_image_url": None,
    }


@router.delete("/parts/{part_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_part(part_id: int, admin: AdminUser, session: DBSession):
    part = session.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    session.delete(part)
    session.commit()
