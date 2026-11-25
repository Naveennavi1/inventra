INVENTRA FRONTEND STARTER
=========================

Included:
- Light rose/pink professional theme with plum sidebar
- JWT login page using the existing POST /auth/login endpoint
- Dashboard using existing analytics, products and low-stock endpoints
- Product list, search, status filters, create, edit and delete
- Responsive sidebar and shared layout

1. Copy the "templates" and "static" folders into:
   C:\Users\Lenovo\haca\inventra\

2. Install Jinja2 if not already installed:
   pip install jinja2

3. Add the following to main.py (keep your existing API router imports/includes):

   from pathlib import Path
   from fastapi import Request
   from fastapi.staticfiles import StaticFiles
   from fastapi.templating import Jinja2Templates

   BASE_DIR = Path(__file__).resolve().parent
   app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
   templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

   @app.get("/login", include_in_schema=False)
   def login_page(request: Request):
       return templates.TemplateResponse("login.html", {"request": request})

   @app.get("/", include_in_schema=False)
   @app.get("/dashboard", include_in_schema=False)
   def dashboard_page(request: Request):
       return templates.TemplateResponse("dashboard.html", {"request": request})

   @app.get("/products", include_in_schema=False)
   def products_page(request: Request):
       return templates.TemplateResponse("products/products.html", {"request": request})

   NOTE: If you already have @app.get("/") for the JSON welcome response,
   replace that route with the dashboard page route above. Do not register
   two GET "/" routes.

4. Ensure your products router is included as it is now:
   app.include_router(products.router)

5. Start the backend from the project root:
   uvicorn main:app --reload

6. Open:
   http://127.0.0.1:8000/login

API assumptions:
- POST /auth/login accepts OAuth2PasswordRequestForm (form-urlencoded username/password).
- GET /auth/me returns the logged-in user.
- GET /products/ returns a list with name, price, category_id, supplier_id, etc.
- GET /categories/ and GET /suppliers/ return lists with id and name.
- GET /analytics/summary returns total_sales and total_revenue.
- GET /analytics/monthly returns year, month, revenue.
- GET /analytics/best-selling-products returns product_name, units_sold, total_revenue.
- GET /inventory/low-stock returns product_id, quantity/current_stock and reorder_level.

If an endpoint has a different response shape in your project, share its response and we can adjust the frontend JS without changing backend business logic.

Security:
- The browser stores the JWT in localStorage for this starter. For a production deployment,
  prefer secure HttpOnly cookies, CSRF protections where applicable, HTTPS, and a stronger
  session strategy. Never place SECRET_KEY or database credentials in frontend code.
