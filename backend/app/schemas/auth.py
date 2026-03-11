from pydantic import BaseModel, field_validator

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def email_must_have_at(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v.lower()

class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator('email')
    @classmethod
    def email_must_have_at(cls, v):
        if '@' not in v:
            raise ValueError('Invalid email')
        return v.lower()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    full_name: str
    roles: list[str]