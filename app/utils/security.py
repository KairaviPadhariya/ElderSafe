from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def normalize_password(password: str) -> str:
    return password[:72]

def hash_password(password: str) -> str:
    return pwd_context.hash(normalize_password(password))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(
        normalize_password(plain_password),
        hashed_password
    )