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
