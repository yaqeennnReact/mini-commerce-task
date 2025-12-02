from .database import engine, Base
from .models import Order, OrderItem

Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")
