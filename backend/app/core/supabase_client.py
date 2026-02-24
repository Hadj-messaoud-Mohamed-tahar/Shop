import os

from supabase import Client, create_client


def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    if not url:
        raise RuntimeError("Supabase configuration is missing: URL")
    last_error: Exception | None = None
    for key in (service_key, anon_key):
        if not key:
            continue
        try:
            return create_client(url, key)
        except Exception as exc:
            last_error = exc
            continue
    raise RuntimeError(f"Supabase configuration is invalid: {last_error or 'no valid key'}")
