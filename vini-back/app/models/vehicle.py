from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint


class Make(SQLModel, table=True):
    __tablename__ = "makes"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, unique=True, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    models: list["Model"] = Relationship(back_populates="make")


class Model(SQLModel, table=True):
    __tablename__ = "models"
    __table_args__ = (UniqueConstraint("make_id", "name"),)

    id: int | None = Field(default=None, primary_key=True)
    make_id: int = Field(foreign_key="makes.id", nullable=False)
    name: str = Field(max_length=100, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    make: Optional[Make] = Relationship(back_populates="models")
    model_years: list["ModelYear"] = Relationship(back_populates="model")


class ModelYear(SQLModel, table=True):
    __tablename__ = "model_years"

    id: int | None = Field(default=None, primary_key=True)
    model_id: int = Field(foreign_key="models.id", nullable=False)
    year_start: int = Field(nullable=False)
    year_end: int = Field(nullable=False)
    generation: str | None = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    model: Optional[Model] = Relationship(back_populates="model_years")
