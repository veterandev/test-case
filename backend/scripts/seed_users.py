from db.session import SessionLocal
from models.user import User
from models.enums import UserRole
from utils.security import generate_qr_key

def create_user(name, email, role):

    db = SessionLocal()

    key = generate_qr_key()

    user = User(
        full_name=name,
        email=email,
        qr_key=key,
        role=role
    )

    db.add(user)
    db.commit()

    print("created:", name)
    print("qr key:", key)

    db.close()


if __name__ == "__main__":

    create_user(
        "Admin User",
        "admin@test.com",
        UserRole.admin
    )

    create_user(
        "Founder Partner User",
        "partner@test.com",
        UserRole.partner
    )

    create_user(
        "Hadi",
        "hadi@test.com",
        UserRole.user_l1
    )

    create_user(
        "Jafar",
        "jafar@test.com",
        UserRole.user_l1
    )

    create_user(
        "Hamid",
        "hamid@test.com",
        UserRole.user_l1
    )

    create_user(
        "Faramarz",
        "faramarz@test.com",
        UserRole.user_l1
    )

    create_user(
        "Guest User 1",
        "user.g1@test.com",
        UserRole.guest
    )

    create_user(
        "Guest User 2",
        "user.g2@test.com",
        UserRole.guest
    )

    create_user(
        "Guest User 3",
        "user.g3@test.com",
        UserRole.guest
    )
