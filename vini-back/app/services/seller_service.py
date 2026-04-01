from sqlmodel import Session

from app.models.seller import Seller
from app.schemas.seller import SellerCreate


def create_seller(session: Session, data: SellerCreate) -> Seller:
    seller = Seller(**data.model_dump())
    session.add(seller)
    session.commit()
    session.refresh(seller)
    return seller


def get_seller_by_id(session: Session, seller_id: int) -> Seller | None:
    return session.get(Seller, seller_id)
