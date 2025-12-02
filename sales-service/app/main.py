from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from . import models  # noqa: F401  ensures models import for table creation
from .database import Base, engine
from .routers import admin, orders  # keep relative import

app = FastAPI(
    title="Sales Service",
    description="Handles orders and sales transactions",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)


def ensure_order_columns() -> None:
    inspector = inspect(engine)
    order_columns = {column["name"] for column in inspector.get_columns("orders")}
    if "tax" not in order_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE orders ADD COLUMN tax FLOAT DEFAULT 0")
            )

    item_columns = {column["name"] for column in inspector.get_columns("order_items")}
    if "product_name" not in item_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE order_items ADD COLUMN product_name VARCHAR(255)")
            )


ensure_order_columns()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3002",
            # newly added
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(orders.router)

@app.get("/")
def root():
    return {"message": "Sales Service is running!"}
