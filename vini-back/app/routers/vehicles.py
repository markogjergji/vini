from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.schemas.vehicle import MakeRead, ModelRead, ModelYearRead
from app.services import vehicle_service

router = APIRouter()


@router.get("/makes", response_model=list[MakeRead])
def list_makes(session: Session = Depends(get_session)) -> list[MakeRead]:
    makes = vehicle_service.get_makes(session)
    return [MakeRead(id=m.id, name=m.name) for m in makes]  # type: ignore[arg-type]


@router.get("/makes/{make_id}/models", response_model=list[ModelRead])
def list_models(make_id: int, session: Session = Depends(get_session)) -> list[ModelRead]:
    models = vehicle_service.get_models_by_make(session, make_id)
    return [ModelRead(id=m.id, make_id=m.make_id, name=m.name) for m in models]  # type: ignore[arg-type]


@router.get("/models/{model_id}/years", response_model=list[ModelYearRead])
def list_years(model_id: int, session: Session = Depends(get_session)) -> list[ModelYearRead]:
    years = vehicle_service.get_years_by_model(session, model_id)
    return [
        ModelYearRead(
            id=y.id, model_id=y.model_id, year_start=y.year_start,  # type: ignore[arg-type]
            year_end=y.year_end, generation=y.generation,
        )
        for y in years
    ]
