from collections.abc import Generator

from sqlalchemy import text
from sqlmodel import SQLModel, Session, create_engine

from app.config import settings

engine = create_engine(settings.database_url, echo=False)


def _run_migrations() -> None:
    """Add columns that may be missing from existing databases."""
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE part_categories ADD COLUMN icon VARCHAR(50)",
            "ALTER TABLE part_categories ADD COLUMN image_url VARCHAR(500)",
            "ALTER TABLE part_categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE part_compatibilities ADD COLUMN specific_year INTEGER",
        ]:
            try:
                conn.execute(text(stmt))
                conn.commit()
            except Exception:
                pass  # column already exists


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _run_migrations()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
