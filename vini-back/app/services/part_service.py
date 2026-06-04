import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import and_, or_
from sqlmodel import Session, select, func, col

from app.config import settings
from app.models.enums import ListingStatus
from app.models.part import Part, PartCompatibility, PartImage, PartCategory
from app.models.seller import Seller
from app.models.vehicle import Make, Model, ModelYear
from app.schemas.part import (
    PartCreate,
    PartUpdate,
    PartListItem,
    PartSearchResponse,
    PartDetail,
    PartImageRead,
    PartCategoryRead,
    CompatibleVehicle,
    CompatVehicleInput,
)
from app.schemas.vehicle import MakeRead, ModelRead, ModelYearRead
from app.schemas.seller import SellerRead


def create_part(session: Session, data: PartCreate) -> Part:
    part = Part(
        seller_id=data.seller_id,
        category_id=data.category_id,
        title=data.title,
        description=data.description,
        price=data.price,
        currency=data.currency,
        condition=data.condition,
        oem_number=data.oem_number,
        location_text=data.location_text,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    session.add(part)
    session.flush()

    for v in data.compatible_vehicles:
        compat = PartCompatibility(part_id=part.id, model_year_id=v.model_year_id, specific_year=v.specific_year)  # type: ignore[arg-type]
        session.add(compat)

    session.commit()
    session.refresh(part)
    return part


def update_part(session: Session, part_id: int, data: PartUpdate) -> Part | None:
    part = session.get(Part, part_id)
    if not part:
        return None

    part.title = data.title
    part.description = data.description
    part.price = data.price
    part.currency = data.currency
    part.condition = data.condition
    part.category_id = data.category_id
    part.oem_number = data.oem_number
    part.location_text = data.location_text
    part.latitude = data.latitude
    part.longitude = data.longitude
    part.updated_at = datetime.now(timezone.utc)

    existing_compats = session.exec(
        select(PartCompatibility).where(PartCompatibility.part_id == part_id)
    ).all()
    for c in existing_compats:
        session.delete(c)
    session.flush()  # ensure deletes hit DB before inserts to avoid UNIQUE violations

    for v in data.compatible_vehicles:
        session.add(PartCompatibility(part_id=part_id, model_year_id=v.model_year_id, specific_year=v.specific_year))  # type: ignore[arg-type]

    session.commit()
    session.refresh(part)
    return part


def delete_part(session: Session, part_id: int) -> bool:
    part = session.get(Part, part_id)
    if not part:
        return False

    for img in session.exec(select(PartImage).where(PartImage.part_id == part_id)).all():
        file_path = Path(settings.upload_dir) / img.filename
        if file_path.exists():
            file_path.unlink()
        session.delete(img)

    for compat in session.exec(select(PartCompatibility).where(PartCompatibility.part_id == part_id)).all():
        session.delete(compat)

    session.delete(part)
    session.commit()
    return True


def reorder_images(session: Session, part_id: int, image_ids: list[int]) -> None:
    for order, img_id in enumerate(image_ids):
        img = session.exec(
            select(PartImage).where(PartImage.id == img_id, PartImage.part_id == part_id)
        ).first()
        if img:
            img.sort_order = order
            img.is_primary = order == 0
    session.commit()


def delete_part_image(session: Session, part_id: int, image_id: int) -> bool:
    img = session.exec(
        select(PartImage).where(PartImage.id == image_id, PartImage.part_id == part_id)
    ).first()
    if not img:
        return False

    file_path = Path(settings.upload_dir) / img.filename
    if file_path.exists():
        file_path.unlink()

    session.delete(img)
    session.commit()
    return True


def search_parts(
    session: Session,
    make_id: int | None = None,
    model_id: int | None = None,
    model_year_id: int | None = None,
    seller_id: int | None = None,
    category_id: int | None = None,
    year: int | None = None,
    page: int = 1,
    limit: int = 20,
) -> PartSearchResponse:
    # Base query for parts
    query = (
        select(Part)
        .where(Part.status == ListingStatus.active)
    )

    if seller_id:
        query = query.where(Part.seller_id == seller_id)

    if category_id:
        child_ids = [
            c.id for c in session.exec(
                select(PartCategory).where(PartCategory.parent_id == category_id)
            ).all()
        ]
        all_category_ids = [category_id] + [cid for cid in child_ids if cid is not None]
        query = query.where(col(Part.category_id).in_(all_category_ids))

    # Join through compatibility chain if any vehicle/year filter is set
    if make_id or model_id or model_year_id or year is not None:
        query = query.join(PartCompatibility, PartCompatibility.part_id == Part.id)
        query = query.join(ModelYear, PartCompatibility.model_year_id == ModelYear.id)

        if model_year_id:
            query = query.where(ModelYear.id == model_year_id)
        else:
            if year is not None:
                query = query.where(
                    or_(
                        PartCompatibility.specific_year == year,
                        and_(PartCompatibility.specific_year == None, ModelYear.year_start <= year, ModelYear.year_end >= year),  # noqa: E711
                    )
                )
            if model_id:
                query = query.where(ModelYear.model_id == model_id)
            elif make_id:
                query = query.join(Model, ModelYear.model_id == Model.id)
                query = query.where(Model.make_id == make_id)

        query = query.distinct()

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()

    # Paginate
    offset = (page - 1) * limit
    results = session.exec(query.order_by(col(Part.created_at).desc()).offset(offset).limit(limit)).all()

    items: list[PartListItem] = []
    for part in results:
        # Get primary image
        primary_img = session.exec(
            select(PartImage).where(PartImage.part_id == part.id, PartImage.is_primary == True)  # noqa: E712
        ).first()
        if not primary_img:
            primary_img = session.exec(
                select(PartImage).where(PartImage.part_id == part.id).order_by(PartImage.sort_order)
            ).first()

        category = session.get(PartCategory, part.category_id) if part.category_id else None

        # Build a compact vehicle label from the first compatible vehicle
        vehicle_label: str | None = None
        first_compat = session.exec(
            select(PartCompatibility).where(PartCompatibility.part_id == part.id).limit(1)
        ).first()
        if first_compat:
            my = session.get(ModelYear, first_compat.model_year_id)
            if my:
                model = session.get(Model, my.model_id)
                if model:
                    make = session.get(Make, model.make_id)
                    if make:
                        total_compats = session.exec(
                            select(func.count()).select_from(
                                select(PartCompatibility).where(PartCompatibility.part_id == part.id).subquery()
                            )
                        ).one()
                        vehicle_label = f"{make.name} {model.name}"
                        if total_compats > 1:
                            vehicle_label += f" +{total_compats - 1}"

        items.append(
            PartListItem(
                id=part.id,  # type: ignore[arg-type]
                title=part.title,
                price=part.price,
                currency=part.currency,
                condition=part.condition,
                status=part.status,
                location_text=part.location_text,
                created_at=part.created_at,
                primary_image_url=primary_img.url if primary_img else None,
                category=PartCategoryRead(
                    id=category.id, name=category.name, slug=category.slug, parent_id=category.parent_id, icon=category.icon, image_url=category.image_url, sort_order=category.sort_order  # type: ignore[arg-type]
                ) if category else None,
                vehicle_label=vehicle_label,
            )
        )

    return PartSearchResponse(items=items, total=total, page=page, limit=limit)


def get_part_detail(session: Session, part_id: int) -> PartDetail | None:
    part = session.get(Part, part_id)
    if not part:
        return None

    seller = session.get(Seller, part.seller_id)
    if not seller:
        return None

    category = session.get(PartCategory, part.category_id) if part.category_id else None

    images = session.exec(
        select(PartImage).where(PartImage.part_id == part_id).order_by(PartImage.sort_order)
    ).all()

    # Get compatible vehicles
    compats = session.exec(
        select(PartCompatibility).where(PartCompatibility.part_id == part_id)
    ).all()

    compatible_vehicles: list[CompatibleVehicle] = []
    for compat in compats:
        my = session.get(ModelYear, compat.model_year_id)
        if not my:
            continue
        model = session.get(Model, my.model_id)
        if not model:
            continue
        make = session.get(Make, model.make_id)
        if not make:
            continue
        compatible_vehicles.append(
            CompatibleVehicle(
                model_year_id=my.id,  # type: ignore[arg-type]
                specific_year=compat.specific_year,
                make=MakeRead(id=make.id, name=make.name),  # type: ignore[arg-type]
                model=ModelRead(id=model.id, make_id=model.make_id, name=model.name),  # type: ignore[arg-type]
                model_year=ModelYearRead(
                    id=my.id, model_id=my.model_id, year_start=my.year_start,  # type: ignore[arg-type]
                    year_end=my.year_end, generation=my.generation,
                ),
            )
        )

    return PartDetail(
        id=part.id,  # type: ignore[arg-type]
        title=part.title,
        description=part.description,
        price=part.price,
        currency=part.currency,
        condition=part.condition,
        status=part.status,
        oem_number=part.oem_number,
        location_text=part.location_text,
        latitude=part.latitude,
        longitude=part.longitude,
        created_at=part.created_at,
        updated_at=part.updated_at,
        seller=SellerRead(
            id=seller.id, name=seller.name, phone=seller.phone, email=seller.email,  # type: ignore[arg-type]
            business_name=seller.business_name, address=seller.address, city=seller.city,
            latitude=seller.latitude, longitude=seller.longitude,
            is_business=seller.is_business, is_verified=seller.is_verified,
        ),
        category=PartCategoryRead(
            id=category.id, name=category.name, slug=category.slug, parent_id=category.parent_id  # type: ignore[arg-type]
        ) if category else None,
        images=[
            PartImageRead(id=img.id, filename=img.filename, url=img.url, is_primary=img.is_primary, sort_order=img.sort_order)  # type: ignore[arg-type]
            for img in images
        ],
        compatible_vehicles=compatible_vehicles,
    )


async def upload_images(session: Session, part_id: int, files: list[UploadFile]) -> list[PartImage]:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    existing_count = session.exec(
        select(func.count(PartImage.id)).where(PartImage.part_id == part_id)
    ).one()

    saved: list[PartImage] = []
    for i, file in enumerate(files):
        ext = Path(file.filename or "img.jpg").suffix
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = upload_dir / unique_name

        content = await file.read()
        file_path.write_bytes(content)

        image = PartImage(
            part_id=part_id,
            filename=unique_name,
            url=f"/uploads/{unique_name}",
            is_primary=(existing_count == 0 and i == 0),
            sort_order=existing_count + i,
        )
        session.add(image)
        saved.append(image)

    session.commit()
    for img in saved:
        session.refresh(img)
    return saved


def get_categories(session: Session) -> list[PartCategory]:
    return list(session.exec(select(PartCategory).order_by(PartCategory.sort_order, PartCategory.name)).all())
