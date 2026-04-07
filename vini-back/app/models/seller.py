from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.part import Part


class Seller(SQLModel, table=True):
    __tablename__ = "sellers"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", unique=True, index=True)
    name: str = Field(max_length=150, nullable=False)
    phone: Optional[str] = Field(default=None, max_length=30)
    email: Optional[str] = Field(default=None, max_length=255)
    business_name: Optional[str] = Field(default=None, max_length=200)
    address: Optional[str] = Field(default=None)
    city: Optional[str] = Field(default=None, max_length=100)
    latitude: Optional[float] = Field(default=None)
    longitude: Optional[float] = Field(default=None)
    is_business: bool = Field(default=False, nullable=False)
    is_verified: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    user: Optional["User"] = Relationship(back_populates="seller")
    parts: list["Part"] = Relationship(back_populates="seller")
