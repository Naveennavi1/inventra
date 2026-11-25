from getpass import getpass

from app.database.connection import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password


def reset_admin():

    db = SessionLocal()

    try:
        admins = db.query(User).filter(
            User.role == UserRole.ADMIN
        ).all()

        if not admins:
            print("No ADMIN accounts found.")
            return

        print("\n===== EXISTING ADMIN ACCOUNTS =====")

        for admin in admins:
            print(
                f"ID: {admin.id} | "
                f"Username: {admin.username} | "
                f"Email: {admin.email}"
            )

        admin_id = int(input("\nEnter the Admin ID to reset: "))

        admin = db.query(User).filter(
            User.id == admin_id,
            User.role == UserRole.ADMIN
        ).first()

        if not admin:
            print("Invalid Admin ID.")
            return

        print("\n===== RESET ADMIN CREDENTIALS =====")

        new_username = input(
            "Enter new username: "
        ).strip()

        new_password = getpass(
            "Enter new password: "
        )

        confirm_password = getpass(
            "Confirm new password: "
        )

        if not new_username or not new_password:
            print("Username and password are required.")
            return

        if len(new_password) < 12:
            print("Password must contain at least 12 characters.")
            return

        if new_password != confirm_password:
            print("Passwords do not match.")
            return

        existing = db.query(User).filter(
            User.username == new_username,
            User.id != admin.id
        ).first()

        if existing:
            print("Username already exists.")
            return

        admin.username = new_username
        admin.hashed_password = hash_password(new_password)
        admin.is_active = True

        db.commit()

        print("\nAdmin credentials updated successfully!")
        print("Username:", admin.username)
        print("Email:", admin.email)
        print("Role: ADMIN")

    except ValueError:
        db.rollback()
        print("Please enter a valid Admin ID.")

    except Exception as error:
        db.rollback()
        print("Error:", error)

    finally:
        db.close()


if __name__ == "__main__":
    reset_admin()