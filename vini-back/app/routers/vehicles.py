from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.schemas.vehicle import MakeRead, ModelRead, ModelYearRead
from app.services import vehicle_service

router = APIRouter()


@router.get("/years", response_model=list[int])
def list_available_years(session: Session = Depends(get_session)) -> list[int]:
    return vehicle_service.get_available_years(session)


@router.get("/years/{year}/makes", response_model=list[MakeRead])
def list_makes_by_year(year: int, session: Session = Depends(get_session)) -> list[MakeRead]:
    makes = vehicle_service.get_makes_by_year(session, year)
    return [MakeRead(id=m.id, name=m.name) for m in makes]  # type: ignore[arg-type]


@router.get("/makes", response_model=list[MakeRead])
def list_makes(session: Session = Depends(get_session)) -> list[MakeRead]:
    makes = vehicle_service.get_makes(session)
    return [MakeRead(id=m.id, name=m.name) for m in makes]  # type: ignore[arg-type]


@router.get("/makes/{make_id}/models", response_model=list[ModelRead])
def list_models(make_id: int, year: int | None = None, session: Session = Depends(get_session)) -> list[ModelRead]:
    models = vehicle_service.get_models_by_make(session, make_id, year)
    return [ModelRead(id=m.id, make_id=m.make_id, name=m.name) for m in models]  # type: ignore[arg-type]


@router.get("/models/{model_id}/trims", response_model=list[ModelYearRead])
def list_trims(model_id: int, year: int | None = None, session: Session = Depends(get_session)) -> list[ModelYearRead]:
    trims = vehicle_service.get_trims_by_model(session, model_id, year)
    return [
        ModelYearRead(
            id=t.id, model_id=t.model_id, year_start=t.year_start,  # type: ignore[arg-type]
            year_end=t.year_end, generation=t.generation,
        )
        for t in trims
    ]
