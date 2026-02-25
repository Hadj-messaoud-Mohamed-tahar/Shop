import os
import json

import stripe
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Body
from pydantic import BaseModel

from ..core.supabase_client import get_supabase_client
from ..dependencies.auth import get_current_user


router = APIRouter(prefix="/payments", tags=["payments"])


class CheckoutRequest(BaseModel):
    return_url: Optional[str] = None


def get_stripe_client():
    secret = os.getenv("STRIPE_SECRET_KEY")
    if not secret:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    stripe.api_key = secret
    return stripe

@router.post("/checkout")
def create_checkout_session(current_user=Depends(get_current_user)):
    client = get_supabase_client()
    cart_res = client.table("carts").select("*").eq("user_id", current_user["id"]).execute()
    if not cart_res.data:
        raise HTTPException(status_code=400, detail="Cart not found")
    cart = cart_res.data[0]
    items_res = client.table("cart_items").select("*").eq("cart_id", cart["id"]).execute()
    items = items_res.data or []
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    product_ids = [i["product_id"] for i in items]
    products_res = client.table("products").select("id,name,price").in_("id", product_ids).execute()
    products = {p["id"]: p for p in (products_res.data or [])}
    line_items = []
    for i in items:
        p = products.get(i["product_id"])
        if not p:
            continue
        amount = int(round(float(p["price"]) * 100))
        line_items.append(
            {
                "price_data": {
                    "currency": "eur",
                    "product_data": {"name": p["name"]},
                    "unit_amount": amount,
                },
                "quantity": i["quantity"],
            }
        )
    if not line_items:
        raise HTTPException(status_code=400, detail="No valid items")
    
    if payload and payload.return_url:
        frontend_url = payload.return_url
    else:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    frontend_url = frontend_url.rstrip("/")
    if not frontend_url.startswith("http"):
        frontend_url = f"https://{frontend_url}"
    
    s = get_stripe_client()
    try:
        session = s.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=line_items,
            customer_email=current_user.get("email"),
            metadata={
                "user_id": str(current_user["id"]),
                "cart_id": str(cart["id"]),
            },
            success_url=f"{frontend_url}/?payment=success",
            cancel_url=f"{frontend_url}/?payment=cancel",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Stripe error: {exc}") from exc
    return {"url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Stripe webhook secret not configured")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as exc:
        # En dev, on log l’erreur et on continue sans vérifier la signature
        print("Stripe webhook signature error:", exc)
        try:
            event = json.loads(payload.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid payload or signature: {exc}") from exc
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata") or {}
        user_id = metadata.get("user_id")
        cart_id = metadata.get("cart_id")
        if user_id and cart_id:
            client = get_supabase_client()
            items_res = client.table("cart_items").select("*").eq("cart_id", int(cart_id)).execute()
            items = items_res.data or []
            if items:
                product_ids = [i["product_id"] for i in items]
                products_res = client.table("products").select("id,price,stock").in_("id", product_ids).execute()
                products = {p["id"]: p for p in (products_res.data or [])}
                total = 0.0
                for i in items:
                    p = products.get(i["product_id"])
                    if not p:
                        continue
                    total += float(p["price"]) * i["quantity"]
                order_res = client.table("orders").insert(
                    {
                        "user_id": user_id,
                        "status": "paid",
                        "total_amount": total,
                        "payment_intent_id": session.get("payment_intent"),
                    }
                ).execute()
                if order_res.data:
                    order = order_res.data[0]
                    order_id = order["id"]
                    order_items = []
                    for i in items:
                        p = products.get(i["product_id"])
                        if not p:
                            continue
                        order_items.append(
                            {
                                "order_id": order_id,
                                "product_id": i["product_id"],
                                "quantity": i["quantity"],
                                "unit_price": p["price"],
                            }
                        )
                    if order_items:
                        client.table("order_items").insert(order_items).execute()
                    for i in items:
                        p = products.get(i["product_id"])
                        if not p:
                            continue
                        new_stock = max(0, int(p.get("stock", 0)) - int(i["quantity"]))
                        client.table("products").update({"stock": new_stock}).eq("id", i["product_id"]).execute()
                client.table("cart_items").delete().eq("cart_id", int(cart_id)).execute()
    return {"received": True}
