from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint

from app.models.enums import PartCondition, ListingStatus


class PartCategory(SQLModel, table=True):
    __tablename__ = "part_categories"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, nullable=False)
    slug: str = Field(max_length=100, unique=True, nullable=False)
    parent_id: int | None = Field(default=None, foreign_key="part_categories.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    children: list["PartCategory"] = Relationship(
        back_populates="parent",
        sa_relationship_kwargs={"foreign_keys": "[PartCategory.parent_id]"},
    )
    parent: Optional["PartCategory"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "PartCategory.id", "foreign_keys": "[PartCategory.parent_id]"},
    )


class Part(SQLModel, table=True):
    __tablename__ = "parts"

    id: int | None = Field(default=None, primary_key=True)
    seller_id: int = Field(foreign_key="sellers.id", nullable=False, index=True)
    category_id: int | None = Field(default=None, foreign_key="part_categories.id", index=True)
    title: str = Field(max_length=200, nullable=False)
    description: str | None = Field(default=None)
    price: float | None = Field(default=None)
    currency: str = Field(default="ALL", max_length=3, nullable=False)
    condition: PartCondition = Field(nullable=False)
    status: ListingStatus = Field(default=ListingStatus.active, nullable=False, index=True)
    oem_number: str | None = Field(default=None, max_length=100)
    location_text: str | None = Field(default=None, max_length=200)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    seller: Optional["Seller"] = Relationship(back_populates="parts")
    category: Optional[PartCategory] = Relationship()
    images: list["PartImage"] = Relationship(back_populates="part")
    compatibilities: list["PartCompatibility"] = Relationship(back_populates="part")


class PartCompatibility(SQLModel, table=True):
    __tablename__ = "part_compatibilities"
    __table_args__ = (UniqueConstraint("part_id", "model_year_id"),)

    id: int | None = Field(default=None, primary_key=True)
    part_id: int = Field(foreign_key="parts.id", nullable=False)
    model_year_id: int = Field(foreign_key="model_years.id", nullable=False, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    part: Optional[Part] = Relationship(back_populates="compatibilities")
    model_year: Optional["ModelYear"] = Relationship()


class PartImage(SQLModel, table=True):
    __tablename__ = "part_images"

    id: int | None = Field(default=None, primary_key=True)
    part_id: int = Field(foreign_key="parts.id", nullable=False)
    filename: str = Field(max_length=255, nullable=False)
    url: str = Field(max_length=500, nullable=False)
    is_primary: bool = Field(default=False, nullable=False)
    sort_order: int = Field(default=0, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    part: Optional[Part] = Relationship(back_populates="images")
