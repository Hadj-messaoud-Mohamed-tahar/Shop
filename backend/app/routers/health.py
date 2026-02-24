from fastapi import APIRouter, HTTPException

from ..core.supabase_client import get_supabase_client


router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {"status": "ok"}


@router.get("/health/supabase")
def supabase_health_check():
    try:
        client = get_supabase_client()
        client.table("products").select("id").limit(1).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Supabase error: {exc}") from exc
    return {"status": "ok", "supabase": "ok"}
