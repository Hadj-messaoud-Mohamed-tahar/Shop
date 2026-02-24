from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from ..core.security import create_access_token
from ..core.supabase_client import get_supabase_client


router = APIRouter(prefix="/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: Optional[str] = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> TokenResponse:
    client = get_supabase_client()
    try:
        auth_response = client.auth.sign_up({"email": payload.email, "password": payload.password})
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Supabase sign up failed: {exc}"
        ) from exc
    user_obj = getattr(auth_response, "user", None)
    if not user_obj or not getattr(user_obj, "id", None):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User creation failed")
    user_id = str(user_obj.id)
    insert_data = {
        "id": user_id,
        "email": payload.email,
        "full_name": payload.full_name,
        "role": payload.role or "user",
    }
    result = client.table("users").upsert(insert_data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="User creation failed")
    user = result.data[0]
    token = create_access_token({"sub": str(user["id"]), "role": user.get("role", "user")})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    client = get_supabase_client()
    try:
        auth_response = client.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    user_obj = getattr(auth_response, "user", None)
    if not user_obj or not getattr(user_obj, "id", None):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    user_id = str(user_obj.id)
    result = client.table("users").select("id,email,role").eq("id", user_id).single().execute()
    user = result.data
    if not user:
        insert_data = {
            "id": user_id,
            "email": payload.email,
            "role": "user",
        }
        created = client.table("users").insert(insert_data).execute()
        user = created.data[0]
    token = create_access_token({"sub": user_id, "role": user.get("role", "user")})
    return TokenResponse(access_token=token)
