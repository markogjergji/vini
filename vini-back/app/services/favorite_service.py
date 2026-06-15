from sqlmodel import Session, select, col

from app.models.enums import ListingStatus
from app.models.favorite import Favorite
from app.models.part import Part
from app.models.seller import Seller
from app.models.user import User, UserRole
from app.schemas.part import PartListItem
from app.services.part_service import build_part_list_item


def is_favorited(session: Session, user_id: int, part_id: int) -> bool:
    return session.exec(
        select(Favorite).where(Favorite.user_id == user_id, Favorite.part_id == part_id)
    ).first() is not None


def add_favorite(session: Session, user_id: int, part_id: int) -> bool:
    """Mark a part as favorited. Returns False if the part does not exist.
    Idempotent: favoriting an already-favorited part is a no-op."""
    if not session.get(Part, part_id):
        return False
    if not is_favorited(session, user_id, part_id):
        session.add(Favorite(user_id=user_id, part_id=part_id))
        session.commit()
    return True


def remove_favorite(session: Session, user_id: int, part_id: int) -> None:
    favorite = session.exec(
        select(Favorite).where(Favorite.user_id == user_id, Favorite.part_id == part_id)
    ).first()
    if favorite:
        session.delete(favorite)
        session.commit()


def get_favorited_part_ids(session: Session, user_id: int) -> list[int]:
    return list(session.exec(select(Favorite.part_id).where(Favorite.user_id == user_id)).all())


def list_favorites(session: Session, user_id: int) -> list[PartListItem]:
    # Only surface favorited parts that are still publicly visible — an active
    # listing whose shop belongs to an active seller. Mirrors part search visibility.
    query = (
        select(Part)
        .join(Favorite, col(Favorite.part_id) == Part.id)
        .join(Seller, col(Part.seller_id) == Seller.id)
        .join(User, Seller.user_id == User.id)
        .where(Favorite.user_id == user_id)
        .where(Part.status == ListingStatus.active)
        .where(User.is_active == True)  # noqa: E712
        .where(User.role == UserRole.seller)
        .order_by(col(Favorite.created_at).desc())
    )
    parts = session.exec(query).all()
    return [build_part_list_item(session, part) for part in parts]
