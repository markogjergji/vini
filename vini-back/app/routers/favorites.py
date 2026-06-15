from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.dependencies.auth import CurrentUser
from app.schemas.part import PartListItem
from app.services import favorite_service

router = APIRouter()


@router.get("/", response_model=list[PartListItem])
def list_favorites(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> list[PartListItem]:
    return favorite_service.list_favorites(session, current_user.id)


@router.get("/ids", response_model=list[int])
def list_favorite_ids(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> list[int]:
    return favorite_service.get_favorited_part_ids(session, current_user.id)


@router.post("/{part_id}", status_code=204)
def add_favorite(
    part_id: int,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    if not favorite_service.add_favorite(session, current_user.id, part_id):
        raise HTTPException(status_code=404, detail="Part not found")


@router.delete("/{part_id}", status_code=204)
def remove_favorite(
    part_id: int,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    favorite_service.remove_favorite(session, current_user.id, part_id)
