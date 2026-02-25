from fastapi import FastAPI
import sentry_sdk
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .routers.auth import router as auth_router
from .routers.cart import router as cart_router
from .routers.health import router as health_router
from .routers.products import router as products_router
from .routers.seed import router as seed_router
from .routers.payments import router as payments_router


load_dotenv(override=True)

sentry_sdk.init(
    dsn="https://b56eb4fce976d6d4d5808374cc910db1@o4510946308390912.ingest.de.sentry.io/4510946329165904",
    # Add data like request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
)

app = FastAPI(title="PC Gaming Shop API", version="0.1.0")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(cart_router, prefix="/api")
app.include_router(seed_router, prefix="/api")
app.include_router(payments_router, prefix="/api")

