from sqlalchemy import distinct, func
from sqlmodel import Session, select

from app.models.vehicle import Make, Model, ModelYear


def get_available_years(session: Session) -> list[int]:
    row = session.exec(
        select(func.min(ModelYear.year_start), func.max(ModelYear.year_end))
    ).one()
    min_year, max_year = row
    if min_year is None:
        return []
    return list(range(min_year, max_year + 1))


def get_makes(session: Session):
    stmt = (
        select(
            Make.id,
            Make.name,
            Make.is_active,
            func.count(distinct(Model.id)).label("model_count"),
            func.count(ModelYear.id).label("generation_count"),
        )
        .outerjoin(Model, Model.make_id == Make.id)  # type: ignore[arg-type]
        .outerjoin(ModelYear, ModelYear.model_id == Model.id)  # type: ignore[arg-type]
        .where(Make.is_active == True)  # noqa: E712
        .group_by(Make.id, Make.name, Make.is_active)
        .order_by(Make.name)
    )
    return list(session.execute(stmt).all())


def get_makes_by_year(session: Session, year: int):
    stmt = (
        select(
            Make.id,
            Make.name,
            Make.is_active,
            func.count(distinct(Model.id)).label("model_count"),
            func.count(ModelYear.id).label("generation_count"),
        )
        .join(Model, Model.make_id == Make.id)  # type: ignore[arg-type]
        .join(ModelYear, ModelYear.model_id == Model.id)  # type: ignore[arg-type]
        .where(ModelYear.year_start <= year, ModelYear.year_end >= year, Make.is_active == True)  # noqa: E712
        .group_by(Make.id, Make.name, Make.is_active)
        .order_by(Make.name)
    )
    return list(session.execute(stmt).all())


def get_all_makes_admin(session: Session, is_active: bool | None = None, year: int | None = None):
    if year is not None:
        stmt = (
            select(
                Make.id,
                Make.name,
                Make.is_active,
                func.count(distinct(Model.id)).label("model_count"),
                func.count(ModelYear.id).label("generation_count"),
            )
            .join(Model, Model.make_id == Make.id)  # type: ignore[arg-type]
            .join(ModelYear, ModelYear.model_id == Model.id)  # type: ignore[arg-type]
            .where(ModelYear.year_start <= year, ModelYear.year_end >= year)
            .group_by(Make.id, Make.name, Make.is_active)
            .order_by(Make.name)
        )
    else:
        stmt = (
            select(
                Make.id,
                Make.name,
                Make.is_active,
                func.count(distinct(Model.id)).label("model_count"),
                func.count(ModelYear.id).label("generation_count"),
            )
            .outerjoin(Model, Model.make_id == Make.id)  # type: ignore[arg-type]
            .outerjoin(ModelYear, ModelYear.model_id == Model.id)  # type: ignore[arg-type]
            .group_by(Make.id, Make.name, Make.is_active)
            .order_by(Make.name)
        )
    if is_active is not None:
        stmt = stmt.where(Make.is_active == is_active)
    return list(session.execute(stmt).all())


def get_models_by_make(session: Session, make_id: int, year: int | None = None) -> list[Model]:
    q = select(Model).where(Model.make_id == make_id)
    if year is not None:
        q = (
            q.join(ModelYear, ModelYear.model_id == Model.id)  # type: ignore[arg-type]
            .where(ModelYear.year_start <= year, ModelYear.year_end >= year)
            .distinct()
        )
    return list(session.exec(q.order_by(Model.name)).all())


def get_trims_by_model(session: Session, model_id: int, year: int | None = None) -> list[ModelYear]:
    q = select(ModelYear).where(ModelYear.model_id == model_id)
    if year is not None:
        q = q.where(ModelYear.year_start <= year, ModelYear.year_end >= year)
    return list(session.exec(q.order_by(ModelYear.generation)).all())
