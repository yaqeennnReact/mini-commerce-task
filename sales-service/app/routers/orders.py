import json
from typing import Dict, List
from urllib.error import URLError
from urllib.request import urlopen

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Order, OrderItem
from app.schemas import OrderCreate, OrderRead
from app.services.settings import get_tax_rate

router = APIRouter(prefix="/orders", tags=["Orders"])

CATALOG_PRODUCTS_URL = "http://localhost:3000/products"


def fetch_product_names() -> Dict[int, str]:
    try:
        with urlopen(CATALOG_PRODUCTS_URL, timeout=5) as response:
            payload = response.read()
    except (URLError, TimeoutError):
        return {}

    try:
        data = json.loads(payload.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}

    names: Dict[int, str] = {}
    for item in data:
        product_id = item.get("id")
        name = item.get("name")
        if product_id is None or name is None:
            continue
        try:
            names[int(product_id)] = str(name)
        except (TypeError, ValueError):
            continue

    return names


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    subtotal_raw = sum(item.price * item.quantity for item in payload.items)
    subtotal = round(subtotal_raw, 2)
    tax_rate = get_tax_rate(db)
    tax = round(subtotal * (tax_rate / 100), 2)
    total = round(subtotal + tax, 2)

    order = Order(
        customer_name=payload.customer_name or "Guest",
        subtotal=subtotal,
        tax=tax,
        total=total,
    )

    for item in payload.items:
        order.items.append(
            OrderItem(
                product_id=item.product_id,
                product_name=item.name,
                variant_id=item.variant_id,
                qty=item.quantity,
                unit_price=item.price,
                total_price=round(item.price * item.quantity, 2),
            )
        )

    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "message": "Order stored",
        "orderId": order.id,
        "total": order.total,
        "items": len(order.items),
    }


@router.get("/", response_model=List[OrderRead])
def list_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
        .all()
    )

    missing_product_ids = {
        item.product_id
        for order in orders
        for item in order.items
        if not item.product_name
    }

    if missing_product_ids:
        lookup = fetch_product_names()
        updated = False
        for order in orders:
            for item in order.items:
                if not item.product_name:
                    name = lookup.get(item.product_id)
                    if name:
                        item.product_name = name
                        updated = True
        if updated:
            db.commit()

    return orders


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    db.delete(order)
    db.commit()
