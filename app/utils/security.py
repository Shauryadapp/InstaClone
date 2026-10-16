from pwdlib import PasswordHash
from jose import jwt


password_hash = PasswordHash.recommended()

SECRET_KEY = "change-this-to-a-random-secret-key"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt