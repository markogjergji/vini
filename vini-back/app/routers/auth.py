from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.database import get_session
from app.dependencies.auth import CurrentUser
from app.schemas.user import RegisterRequest, LoginRequest, TokenResponse, UserRead, UserProfileUpdate
from app.services.auth_service import register_user, authenticate_user, build_token_response

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, session: Annotated[Session, Depends(get_session)]):
    try:
        user = register_user(session, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return build_token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, session: Annotated[Session, Depends(get_session)]):
    user = authenticate_user(session, data.username, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return build_token_response(user)


@router.get("/me", response_model=UserRead)
def me(current_user: CurrentUser):
    return current_user


@router.put("/me", response_model=UserRead)
def update_me(
    data: UserProfileUpdate,
    current_user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user
