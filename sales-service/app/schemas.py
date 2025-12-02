from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class OrderItemCreate(BaseModel):
    product_id: int = Field(alias="productId")
    quantity: int
    price: float
    variant_id: Optional[int] = Field(default=None, alias="variantId")
    name: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class OrderCreate(BaseModel):
    customer_name: Optional[str] = Field(default="Guest", alias="customerName")
    items: List[OrderItemCreate]

    model_config = ConfigDict(populate_by_name=True)


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str]
    variant_id: Optional[int]
    qty: int
    unit_price: float
    total_price: float

    model_config = ConfigDict(from_attributes=True)


class OrderRead(BaseModel):
    id: int
    customer_name: str
    subtotal: float
    tax: float
    total: float
    created_at: datetime
    items: List[OrderItemRead]

    model_config = ConfigDict(from_attributes=True)


class TaxResponse(BaseModel):
    amount: float


class TaxUpdate(BaseModel):
    amount: float
