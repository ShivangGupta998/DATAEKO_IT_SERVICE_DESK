from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):

    username: str
    email: EmailStr
    password: str
    role_id: int
    department_id: int



class UserLogin(BaseModel):

    email: EmailStr
    password: str