from datetime import datetime, timezone

from sqlmodel import SQLModel, Field, Relationship


class Seller(SQLModel, table=True):
    __tablename__ = "sellers"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=150, nullable=False)
    phone: str | None = Field(default=None, max_length=30)
    email: str | None = Field(default=None, max_length=255)
    business_name: str | None = Field(default=None, max_length=200)
    address: str | None = Field(default=None)
    city: str | None = Field(default=None, max_length=100)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    is_business: bool = Field(default=False, nullable=False)
    is_verified: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    parts: list["Part"] = Relationship(back_populates="seller")
