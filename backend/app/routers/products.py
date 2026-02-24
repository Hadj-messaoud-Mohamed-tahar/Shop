from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..core.supabase_client import get_supabase_client


router = APIRouter(prefix="/products", tags=["products"])


class Product(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    brand: Optional[str] = None
    category_id: int
    stock: int
    image_url: Optional[str] = None


@router.get("", response_model=List[Product])
def list_products(
    category_id: Optional[int] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    brand: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
) -> List[Product]:
    client = get_supabase_client()
    query = client.table("products").select("*")
    if category_id is not None:
        query = query.eq("category_id", category_id)
    if min_price is not None:
        query = query.gte("price", min_price)
    if max_price is not None:
        query = query.lte("price", max_price)
    if brand is not None:
        query = query.eq("brand", brand)
    if search:
        pattern = f"%{search}%"
        query = query.ilike("name", pattern)
    result = query.execute()
    items = result.data or []
    return [Product(**item) for item in items]


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: int) -> Product:
    client = get_supabase_client()
    result = client.table("products").select("*").eq("id", product_id).single().execute()
    item = result.data
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**item)
