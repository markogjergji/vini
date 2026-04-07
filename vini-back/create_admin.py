"""Run once to create the first admin account.

Usage:
    python create_admin.py [email] [username] [password]

Defaults:
    email:    admin@vini.al
    username: admin
    password: admin1234
"""
import sys
from sqlmodel import Session
from app.database import engine, init_db
import app.models.user  # noqa — register tables
import app.models.seller  # noqa
import app.models.vehicle  # noqa
import app.models.part  # noqa
from app.models.user import User, UserRole
from app.core.security import hash_password
from sqlmodel import select

email    = sys.argv[1] if len(sys.argv) > 1 else "admin@vini.al"
username = sys.argv[2] if len(sys.argv) > 2 else "admin"
password = sys.argv[3] if len(sys.argv) > 3 else "admin1234"

init_db()

with Session(engine) as session:
    existing = session.exec(select(User).where(User.username == username)).first()
    if existing:
        print(f"User '{username}' already exists (role={existing.role})")
    else:
        user = User(
            email=email,
            username=username,
            full_name="Administrator",
            hashed_password=hash_password(password),
            role=UserRole.admin,
        )
        session.add(user)
        session.commit()
        print(f"Admin created: email={email}  username={username}  password={password}")
