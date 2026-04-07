from datetime import datetime, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select, func

from app.database import get_session
from app.dependencies.auth import AdminUser
from app.models.user import User, UserRole
from app.models.seller import Seller
from app.models.part import Part, PartCategory
from app.schemas.user import UserRead, UserUpdate
from app.schemas.seller import SellerUpdate
from app.services.auth_service import assign_seller_role, revoke_seller_role, get_user_by_id

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


@router.get("/users", response_model=list[UserAdminRead])
def list_users(admin: AdminUser, session: DBSession, skip: int = 0, limit: int = 50):
    users = session.exec(select(User).offset(skip).limit(limit)).all()
    user_ids = [u.id for u in users]
    sellers = session.exec(select(Seller).where(Seller.user_id.in_(user_ids))).all() if user_ids else []
    seller_map = {s.user_id: s.id for s in sellers}
    return [
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


@router.get("/sellers", response_model=list[SellerAdminRead])
def list_sellers(admin: AdminUser, session: DBSession, skip: int = 0, limit: int = 50):
    sellers = session.exec(select(Seller).offset(skip).limit(limit)).all()
    user_ids = [s.user_id for s in sellers if s.user_id]
    users = session.exec(select(User).where(User.id.in_(user_ids))).all() if user_ids else []
    user_map = {u.id: u.username for u in users}
    return [
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

class PartAdminUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    condition: Optional[str] = None
    status: Optional[str] = None
    oem_number: Optional[str] = None
    location_text: Optional[str] = None


@router.get("/parts")
def list_parts(admin: AdminUser, session: DBSession, skip: int = 0, limit: int = 50):
    parts = session.exec(select(Part).offset(skip).limit(limit)).all()
    seller_ids = list({p.seller_id for p in parts})
    sellers = session.exec(select(Seller).where(Seller.id.in_(seller_ids))).all() if seller_ids else []
    seller_map = {s.id: s for s in sellers}
    category_ids = list({p.category_id for p in parts if p.category_id})
    categories = session.exec(select(PartCategory).where(PartCategory.id.in_(category_ids))).all() if category_ids else []
    category_map = {c.id: c.name for c in categories}
    return [
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
        }
        for p in parts
    ]


@router.patch("/parts/{part_id}")
def update_part(part_id: int, data: PartAdminUpdate, admin: AdminUser, session: DBSession):
    part = session.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(part, field, val)
    part.updated_at = datetime.now(timezone.utc)
    session.add(part)
    session.commit()
    session.refresh(part)
    seller = session.get(Seller, part.seller_id)
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
        "category_name": None,
        "created_at": part.created_at,
    }


@router.delete("/parts/{part_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_part(part_id: int, admin: AdminUser, session: DBSession):
    part = session.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    session.delete(part)
    session.commit()
