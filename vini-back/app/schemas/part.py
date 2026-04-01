from datetime import datetime

from pydantic import BaseModel

from app.models.enums import PartCondition, ListingStatus
from app.schemas.seller import SellerRead
from app.schemas.vehicle import MakeRead, ModelRead, ModelYearRead


class PartCategoryRead(BaseModel):
    id: int
    name: str
    slug: str
    parent_id: int | None


class PartImageRead(BaseModel):
    id: int
    filename: str
    url: str
    is_primary: bool
    sort_order: int


class CompatibleVehicle(BaseModel):
    model_year_id: int
    make: MakeRead
    model: ModelRead
    model_year: ModelYearRead


class PartCreate(BaseModel):
    seller_id: int
    category_id: int | None = None
    title: str
    description: str | None = None
    price: float | None = None
    currency: str = "ALL"
    condition: PartCondition
    oem_number: str | None = None
    location_text: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    compatible_model_year_ids: list[int] = []


class PartListItem(BaseModel):
    id: int
    title: str
    price: float | None
    currency: str
    condition: PartCondition
    status: ListingStatus
    location_text: str | None
    created_at: datetime
    primary_image_url: str | None
    category: PartCategoryRead | None


class PartSearchResponse(BaseModel):
    items: list[PartListItem]
    total: int
    page: int
    limit: int


class PartDetail(BaseModel):
    id: int
    title: str
    description: str | None
    price: float | None
    currency: str
    condition: PartCondition
    status: ListingStatus
    oem_number: str | None
    location_text: str | None
    latitude: float | None
    longitude: float | None
    created_at: datetime
    updated_at: datetime
    seller: SellerRead
    category: PartCategoryRead | None
    images: list[PartImageRead]
    compatible_vehicles: list[CompatibleVehicle]
