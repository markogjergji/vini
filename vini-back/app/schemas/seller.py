from typing import Optional

from pydantic import BaseModel


class SellerCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    business_name: str | None = None
    address: str | None = None
    city: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_business: bool = False


class SellerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    business_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    is_business: Optional[bool] = None


class SellerRead(BaseModel):
    id: int
    name: str
    phone: str | None
    email: str | None
    business_name: str | None
    address: str | None
    city: str | None
    latitude: float | None
    longitude: float | None
    is_business: bool
    is_verified: bool
