import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    partner = "founder-partner"
    user_l1 = "user-gold"
    user_l2 = "user-silver"
    guest = "guest"
