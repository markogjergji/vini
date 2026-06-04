from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session

from app.database import get_session
from app.schemas.part import (
    PartCreate,
    PartCategoryCreate,
    PartCategoryUpdate,
    PartUpdate,
    ImageReorderRequest,
    PartSearchResponse,
    PartDetail,
    PartImageRead,
    PartCategoryRead,
)
from app.services import part_service

router = APIRouter()


@router.get("/search", response_model=PartSearchResponse)
def search_parts(
    make_id: int | None = None,
    model_id: int | None = None,
    model_year_id: int | None = None,
    seller_id: int | None = None,
    category_id: int | None = None,
    year: int | None = None,
    condition: str | None = None,
    sort: str = "newest",
    page: int = 1,
    limit: int = 20,
    session: Session = Depends(get_session),
) -> PartSearchResponse:
    return part_service.search_parts(session, make_id, model_id, model_year_id, seller_id, category_id, year, condition, sort, page, limit)


@router.get("/categories", response_model=list[PartCategoryRead])
def list_categories(session: Session = Depends(get_session)) -> list[PartCategoryRead]:
    cats = part_service.get_categories(session)
    return [
        PartCategoryRead(id=c.id, name=c.name, slug=c.slug, parent_id=c.parent_id, icon=c.icon, image_url=c.image_url, sort_order=c.sort_order)  # type: ignore[arg-type]
        for c in cats
    ]


@router.get("/{part_id}", response_model=PartDetail)
def get_part(part_id: int, session: Session = Depends(get_session)) -> PartDetail:
    detail = part_service.get_part_detail(session, part_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Part not found")
    return detail


@router.post("/", response_model=PartDetail)
def create_part(data: PartCreate, session: Session = Depends(get_session)) -> PartDetail:
    part = part_service.create_part(session, data)
    detail = part_service.get_part_detail(session, part.id)  # type: ignore[arg-type]
    if not detail:
        raise HTTPException(status_code=500, detail="Failed to create part")
    return detail


@router.put("/{part_id}", response_model=PartDetail)
def update_part(part_id: int, data: PartUpdate, session: Session = Depends(get_session)) -> PartDetail:
    part = part_service.update_part(session, part_id, data)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    detail = part_service.get_part_detail(session, part.id)  # type: ignore[arg-type]
    if not detail:
        raise HTTPException(status_code=500, detail="Failed to retrieve updated part")
    return detail


@router.delete("/{part_id}", status_code=204)
def delete_part(part_id: int, session: Session = Depends(get_session)) -> None:
    deleted = part_service.delete_part(session, part_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Part not found")


@router.patch("/{part_id}/images/reorder", status_code=204)
def reorder_images(part_id: int, data: ImageReorderRequest, session: Session = Depends(get_session)) -> None:
    part_service.reorder_images(session, part_id, data.image_ids)


@router.delete("/{part_id}/images/{image_id}", status_code=204)
def delete_part_image(part_id: int, image_id: int, session: Session = Depends(get_session)) -> None:
    deleted = part_service.delete_part_image(session, part_id, image_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")


@router.post("/{part_id}/images", response_model=list[PartImageRead])
async def upload_images(
    part_id: int,
    files: list[UploadFile] = File(...),
    session: Session = Depends(get_session),
) -> list[PartImageRead]:
    images = await part_service.upload_images(session, part_id, files)
    return [
        PartImageRead(id=img.id, filename=img.filename, url=img.url, is_primary=img.is_primary, sort_order=img.sort_order)  # type: ignore[arg-type]
        for img in images
    ]
