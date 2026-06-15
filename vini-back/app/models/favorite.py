from datetime import datetime, timezone

from sqlmodel import SQLModel, Field, UniqueConstraint


class Favorite(SQLModel, table=True):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "part_id"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)
    part_id: int = Field(foreign_key="parts.id", nullable=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False, index=True)
