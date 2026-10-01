from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role_id: int = 4  # Default to Employee role
    department_id: Optional[int] = 1  # Default to department ID 1 if omitted or null


class UserLogin(BaseModel):
    email: EmailStr
    password: str