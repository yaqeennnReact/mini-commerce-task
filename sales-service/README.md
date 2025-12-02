# Sales Service

FastAPI microservice responsible for recording orders and exposing tax configuration used by the storefront.

## Requirements

- Python 3.11+
- `pip` (or another PEP 517 compliant installer)
- MySQL instance accessible from your machine (e.g., via MySQL Workbench)

## Installation

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

The service connects to MySQL using the credentials defined in `app/database.py`. Update the connection string to match your local Workbench credentials if needed.

When you first run the service the schema is created automatically. You can also force creation manually:

```powershell
venv\Scripts\activate
python -m app.create_tables
```

## Running the API

```powershell
venv\Scripts\activate
uvicorn app.main:app --reload
```

The server starts on `http://localhost:8000`. CORS is enabled for the companion web application.

## Key Endpoints

- `GET /` – health response.
- `GET /orders` – list the latest orders with their line items.
- `POST /orders` – create an order. Payload shape:

  ```json
  {
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "price": 29.99,
        "variantId": 5,
        "name": "Everyday Tee"
      }
    ]
  }
  ```

- `DELETE /orders/{id}` – remove an order.
- `GET /admin/tax` – retrieve the active tax rate (%).
- `PUT /admin/tax` – update the tax rate. Body: `{ "amount": 7.5 }`.

## Smoke Test

With the server running:

```powershell
curl -X GET http://localhost:8000/orders
curl -X PUT http://localhost:8000/admin/tax -H "Content-Type: application/json" -d "{\"amount\": 5.0}"
```

If you use different MySQL credentials, edit `app/database.py` accordingly and re-run the service.
