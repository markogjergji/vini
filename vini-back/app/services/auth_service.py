from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole
from app.models.seller import Seller
from app.schemas.user import RegisterRequest, UserRead, TokenResponse


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).first()


def get_user_by_username(session: Session, username: str) -> Optional[User]:
    return session.exec(select(User).where(User.username == username)).first()


def get_user_by_id(session: Session, user_id: int) -> Optional[User]:
    return session.get(User, user_id)


def register_user(session: Session, data: RegisterRequest) -> User:
    if get_user_by_email(session, data.email):
        raise ValueError("Email already registered")
    if get_user_by_username(session, data.username):
        raise ValueError("Username already taken")

    user = User(
        email=data.email,
        username=data.username,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        role=UserRole.user,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, username_or_email: str, password: str) -> Optional[User]:
    user = get_user_by_username(session, username_or_email)
    if not user:
        user = get_user_by_email(session, username_or_email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def build_token_response(user: User) -> TokenResponse:
    token = create_access_token(subject=user.id, extra={"role": user.role})
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


def assign_seller_role(session: Session, user: User, seller_data: dict) -> Seller:
    """Promote a user to seller, restoring their existing shop if they had one.

    A user owns at most one shop for their lifetime. If the user was previously a
    seller and got demoted, the original Seller row is still bound to them, so we
    restore that shop unchanged instead of creating a duplicate. The supplied
    ``seller_data`` only seeds a brand-new shop; an existing shop is edited
    through the seller-profile endpoints, not by re-promoting.
    """
    seller = session.exec(select(Seller).where(Seller.user_id == user.id)).first()
    if seller is None:
        seller = Seller(
            user_id=user.id,
            name=seller_data.get("name", user.full_name),
            phone=seller_data.get("phone"),
            email=seller_data.get("email", user.email),
            business_name=seller_data.get("business_name"),
            city=seller_data.get("city"),
            is_business=seller_data.get("is_business", False),
        )
        session.add(seller)

    user.role = UserRole.seller
    user.updated_at = datetime.now(timezone.utc)
    session.add(user)

    session.commit()
    session.refresh(seller)
    return seller


def revoke_seller_role(session: Session, user: User) -> None:
    """Demote a seller back to a regular user.

    The shop record is kept intact and still bound to the user so it can be
    restored unchanged on re-promotion. It is hidden from public listings while
    the owner is not an active seller (see the visibility filters in
    part_service / seller_service), not deleted or orphaned.
    """
    user.role = UserRole.user
    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
