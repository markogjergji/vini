from sqlmodel import Session, select

from app.models.seller import Seller
from app.schemas.seller import SellerCreate, SellerUpdate


def create_seller(session: Session, data: SellerCreate) -> Seller:
    seller = Seller(**data.model_dump())
    session.add(seller)
    session.commit()
    session.refresh(seller)
    return seller


def get_seller_by_id(session: Session, seller_id: int) -> Seller | None:
    return session.get(Seller, seller_id)


def get_seller_by_user_id(session: Session, user_id: int) -> Seller | None:
    return session.exec(select(Seller).where(Seller.user_id == user_id)).first()


def update_seller(session: Session, seller: Seller, data: SellerUpdate) -> Seller:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(seller, field, value)
    session.add(seller)
    session.commit()
    session.refresh(seller)
    return seller
