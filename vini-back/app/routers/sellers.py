from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.dependencies.auth import CurrentUser
from app.schemas.seller import SellerCreate, SellerRead, SellerUpdate
from app.services import seller_service

router = APIRouter()


def _seller_to_read(seller) -> SellerRead:
    return SellerRead(
        id=seller.id, name=seller.name, phone=seller.phone, email=seller.email,
        business_name=seller.business_name, address=seller.address, city=seller.city,
        latitude=seller.latitude, longitude=seller.longitude,
        is_business=seller.is_business, is_verified=seller.is_verified,
    )


@router.get("/me", response_model=SellerRead)
def get_my_seller(
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> SellerRead:
    seller = seller_service.get_seller_by_user_id(session, current_user.id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")
    return _seller_to_read(seller)


@router.put("/me", response_model=SellerRead)
def update_my_seller(
    data: SellerUpdate,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> SellerRead:
    seller = seller_service.get_seller_by_user_id(session, current_user.id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller profile not found")
    seller = seller_service.update_seller(session, seller, data)
    return _seller_to_read(seller)


@router.post("/", response_model=SellerRead)
def create_seller(data: SellerCreate, session: Session = Depends(get_session)) -> SellerRead:
    seller = seller_service.create_seller(session, data)
    return _seller_to_read(seller)


@router.get("/{seller_id}", response_model=SellerRead)
def get_seller(seller_id: int, session: Session = Depends(get_session)) -> SellerRead:
    seller = seller_service.get_seller_by_id(session, seller_id)
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    return _seller_to_read(seller)
