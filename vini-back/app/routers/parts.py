from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session

from app.database import get_session
from app.schemas.part import (
    PartCreate,
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
    page: int = 1,
    limit: int = 20,
    session: Session = Depends(get_session),
) -> PartSearchResponse:
    return part_service.search_parts(session, make_id, model_id, model_year_id, page, limit)


@router.get("/categories", response_model=list[PartCategoryRead])
def list_categories(session: Session = Depends(get_session)) -> list[PartCategoryRead]:
    cats = part_service.get_categories(session)
    return [
        PartCategoryRead(id=c.id, name=c.name, slug=c.slug, parent_id=c.parent_id)  # type: ignore[arg-type]
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
