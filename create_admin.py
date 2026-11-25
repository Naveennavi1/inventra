from getpass import getpass

from app.database.connection import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


def create_admin():

    db = SessionLocal()

    try:
        print("\n===== INVENTRA ADMIN ACCOUNT CREATION =====\n")

        username = input("Enter admin username: ").strip()
        email = input("Enter admin email: ").strip()

        password = getpass("Enter admin password: ")
        confirm_password = getpass("Confirm admin password: ")

        if not username or not email or not password:
            print("\nAll fields are required.")
            return

        if password != confirm_password:
            print("\nPasswords do not match.")
            return

        if len(password) < 12:
            print("\nPassword must contain at least 12 characters.")
            return

        existing_user = db.query(User).filter(
            (User.username == username) |
            (User.email == email)
        ).first()

        if existing_user:
            print("\nUsername or email already exists.")
            return

        admin = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True
        )

        db.add(admin)
        db.commit()

        print("\nAdmin account created successfully!")
        print(f"Username: {username}")
        print(f"Email: {email}")
        print("Role: ADMIN")

    except Exception as error:
        db.rollback()
        print("\nError creating admin account:", error)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()