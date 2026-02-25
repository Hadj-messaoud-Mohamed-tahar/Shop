from fastapi import APIRouter
from ..core.supabase_client import get_supabase_client

router = APIRouter(prefix="/seed", tags=["dev"])

@router.post("/run")
def run_seed():
    client = get_supabase_client()
    cat = client.table("categories").select("id").eq("slug", "gpu").execute()
    if not cat.data:
        client.table("categories").insert({"name": "Cartes graphiques", "slug": "gpu"}).execute()
    cat = client.table("categories").select("id").eq("slug", "cpu").execute()
    if not cat.data:
        client.table("categories").insert({"name": "Processeurs", "slug": "cpu"}).execute()
    cats = client.table("categories").select("*").execute().data or []
    cat_map = {c["slug"]: c["id"] for c in cats}
    existing = client.table("products").select("id").limit(1).execute()
    if not existing.data:
        products = [
            {
                "name": "NVIDIA GeForce RTX 4070",
                "slug": "rtx-4070",
                "price": 649.00,
                "brand": "NVIDIA",
                "category_id": cat_map.get("gpu"),
                "stock": 20,
                "image_url": "/images/products/rtx-4070.jpg",
            },
            {
                "name": "AMD Ryzen 7 7800X3D",
                "slug": "ryzen-7-7800x3d",
                "price": 429.00,
                "brand": "AMD",
                "category_id": cat_map.get("cpu"),
                "stock": 15,
                "image_url": "/images/products/ryzen-7-7800x3d.jpg",
            },
            {
                "name": "Intel Core i7-13700K",
                "slug": "intel-i7-13700k",
                "price": 399.00,
                "brand": "Intel",
                "category_id": cat_map.get("cpu"),
                "stock": 25,
                "image_url": "/images/products/intel-i7-13700k.webp",
            },
        ]
        client.table("products").insert(products).execute()
    return {"status": "ok"}
