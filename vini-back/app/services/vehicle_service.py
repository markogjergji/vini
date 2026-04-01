from sqlmodel import Session, select

from app.models.vehicle import Make, Model, ModelYear


def get_makes(session: Session) -> list[Make]:
    return list(session.exec(select(Make).order_by(Make.name)).all())


def get_models_by_make(session: Session, make_id: int) -> list[Model]:
    return list(session.exec(select(Model).where(Model.make_id == make_id).order_by(Model.name)).all())


def get_years_by_model(session: Session, model_id: int) -> list[ModelYear]:
    return list(
        session.exec(
            select(ModelYear).where(ModelYear.model_id == model_id).order_by(ModelYear.year_start)
        ).all()
    )
