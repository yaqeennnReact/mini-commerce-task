from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Setting

TAX_RATE_KEY = "order_tax_rate"
LEGACY_TAX_KEY = "order_tax_amount"


def get_setting(db: Session, key: str) -> Setting | None:
    return db.query(Setting).filter(Setting.key == key).first()


def upsert_setting(db: Session, key: str, value: str) -> Setting:
    setting = get_setting(db, key)
    if setting:
        setting.value = value
    else:
        setting = Setting(key=key, value=value)
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return setting


def get_tax_rate(db: Session) -> float:
    setting = get_setting(db, TAX_RATE_KEY)
    if not setting:
        legacy = get_setting(db, LEGACY_TAX_KEY)
        if legacy:
            try:
                legacy_rate = float(legacy.value)
            except (TypeError, ValueError):
                return 0.0

            sanitized = max(0.0, round(legacy_rate, 2))
            new_setting = Setting(key=TAX_RATE_KEY, value=f"{sanitized:.2f}")
            db.add(new_setting)
            db.delete(legacy)
            db.commit()
            return sanitized

        return 0.0

    try:
        rate = float(setting.value)
    except (TypeError, ValueError):
        return 0.0

    return max(0.0, rate)


def update_tax_rate(db: Session, rate: float) -> float:
    sanitized = max(0.0, round(rate, 2))
    upsert_setting(db, TAX_RATE_KEY, f"{sanitized:.2f}")
    legacy = get_setting(db, LEGACY_TAX_KEY)
    if legacy:
        db.delete(legacy)
        db.commit()
    return sanitized
