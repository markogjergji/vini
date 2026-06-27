from collections.abc import Generator

from sqlalchemy import event, text
from sqlmodel import SQLModel, Session, create_engine

from app.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

# SQLite fails a write immediately with "database is locked" the moment another
# connection holds the lock, unless a busy_timeout is set. Combined with WAL
# mode (readers no longer block writers), this lets concurrent requests wait
# briefly for the lock instead of erroring out. check_same_thread=False is
# required because FastAPI runs sync endpoints across a thread pool.
_connect_args = {"check_same_thread": False, "timeout": 30} if _is_sqlite else {}

engine = create_engine(settings.database_url, echo=False, connect_args=_connect_args)


if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_conn, _record) -> None:
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA busy_timeout=30000")
        cur.execute("PRAGMA synchronous=NORMAL")
        cur.close()


def _run_migrations() -> None:
    """Add columns that may be missing from existing databases."""
    with engine.connect() as conn:
        for stmt in [
            "ALTER TABLE part_categories ADD COLUMN icon VARCHAR(50)",
            "ALTER TABLE part_categories ADD COLUMN image_url VARCHAR(500)",
            "ALTER TABLE part_categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE part_compatibilities ADD COLUMN specific_year INTEGER",
            "ALTER TABLE makes ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1",
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
