from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.schemas.seller import SellerCreate, SellerRead
from app.services import seller_service

router = APIRouter()


@router.post("/", response_model=SellerRead)
def create_seller(data: SellerCreate, session: Session = Depends(get_session)) -> SellerRead:
    seller = seller_service.create_seller(session, data)
    return SellerRead(
        id=seller.id, name=seller.name, phone=seller.phone, email=seller.email,  # type: ignore[arg-type]
        business_name=seller.business_name, address=seller.address, city=seller.city,
        latitude=seller.latitude, longitude=seller.longitude,
        is_business=seller.is_business, is_verified=seller.is_verified,
    )


@router.get("/{seller_id}", response_model=SellerRead)
def get_seller(seller_id: int, session: Session = Depends(get_session)) -> SellerRead:
    seller = seller_service.get_seller_by_id(session, seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    return SellerRead(
        id=seller.id, name=seller.name, phone=seller.phone, email=seller.email,  # type: ignore[arg-type]
        business_name=seller.business_name, address=seller.address, city=seller.city,
        latitude=seller.latitude, longitude=seller.longitude,
        is_business=seller.is_business, is_verified=seller.is_verified,
    )
