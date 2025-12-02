from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import TaxResponse, TaxUpdate
from app.services.settings import get_tax_rate, update_tax_rate

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/tax", response_model=TaxResponse)
def read_tax_amount(db: Session = Depends(get_db)):
    amount = get_tax_rate(db)
    return TaxResponse(amount=amount)


@router.put("/tax", response_model=TaxResponse)
def set_tax_amount(payload: TaxUpdate, db: Session = Depends(get_db)):
    amount = update_tax_rate(db, payload.amount)
    return TaxResponse(amount=amount)
