from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..core.supabase_client import get_supabase_client
from ..dependencies.auth import get_current_user


router = APIRouter(prefix="/cart", tags=["cart"])


class CartItem(BaseModel):
    id: int
    product_id: int
    quantity: int


class CartResponse(BaseModel):
    id: int
    items: List[CartItem]


class AddCartItemRequest(BaseModel):
    product_id: int
    quantity: int = 1


def get_or_create_cart(client, user_id: str) -> Dict[str, Any]:
    result = client.table("carts").select("*").eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    created = client.table("carts").insert({"user_id": user_id}).execute()
    if not created.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Cart creation failed")
    return created.data[0]


@router.get("", response_model=CartResponse)
def get_cart(current_user=Depends(get_current_user)) -> CartResponse:
    client = get_supabase_client()
    cart = get_or_create_cart(client, current_user["id"])
    items_result = client.table("cart_items").select("*").eq("cart_id", cart["id"]).execute()
    items = items_result.data or []
    return CartResponse(id=cart["id"], items=[CartItem(**item) for item in items])


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_item(payload: AddCartItemRequest, current_user=Depends(get_current_user)) -> CartResponse:
    client = get_supabase_client()
    cart = get_or_create_cart(client, current_user["id"])
    existing = (
        client.table("cart_items")
        .select("*")
        .eq("cart_id", cart["id"])
        .eq("product_id", payload.product_id)
        .execute()
    )
    if existing.data:
        item = existing.data[0]
        new_quantity = item["quantity"] + payload.quantity
        client.table("cart_items").update({"quantity": new_quantity}).eq("id", item["id"]).execute()
    else:
        client.table("cart_items").insert(
            {"cart_id": cart["id"], "product_id": payload.product_id, "quantity": payload.quantity}
        ).execute()
    items_result = client.table("cart_items").select("*").eq("cart_id", cart["id"]).execute()
    items = items_result.data or []
    return CartResponse(id=cart["id"], items=[CartItem(**item) for item in items])

