from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.routers import auth
from app.database.connection import engine, Base
from app import models

from app.routers import (
    categories,
    products,
    suppliers,
    inventory,
    purchases,
    sales,
    reorder,
    dead_stock,
    batches,
    expiry,
    analytics
)


# --------------------------------
# FASTAPI APPLICATION
# --------------------------------

app = FastAPI(
    title="Inventra API",
    description="Intelligent Supermarket Inventory & Optimization System",
    version="1.0.0"
)


# --------------------------------
# FRONTEND CONFIGURATION
# --------------------------------

BASE_DIR = Path(__file__).resolve().parent

app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static"
)

templates = Jinja2Templates(
    directory=str(BASE_DIR / "templates")
)


# --------------------------------
# API ROUTERS
# --------------------------------

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(suppliers.router)
app.include_router(inventory.router)
app.include_router(purchases.router)
app.include_router(sales.router)
app.include_router(reorder.router)
app.include_router(dead_stock.router)
app.include_router(batches.router)
app.include_router(expiry.router)
app.include_router(analytics.router)


# --------------------------------
# DATABASE INITIALIZATION
# --------------------------------

@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


# --------------------------------
# FRONTEND PAGE ROUTES
# --------------------------------

@app.get("/login", include_in_schema=False)
def login_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={}
    )


@app.get("/", include_in_schema=False)
@app.get("/dashboard", include_in_schema=False)
def dashboard_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={}
    )


@app.get("/products", include_in_schema=False)
def products_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="products/products.html",
        context={}
    )

@app.get("/inventory-page", include_in_schema=False)
def inventory_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="inventory/inventory.html",
        context={}
    )
@app.get("/categories-page", include_in_schema=False)
def categories_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="categories/categories.html",
        context={}
    )

@app.get("/suppliers-page", include_in_schema=False)
def suppliers_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="suppliers.html",
        context={}
    )


@app.get("/purchases-page", include_in_schema=False)
def purchases_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="purchases.html",
        context={}
    )

@app.get("/sales-page", include_in_schema=False)
def sales_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="sales.html",
        context={}
    )

@app.get("/reorder-page", include_in_schema=False)
def reorder_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="reorder.html",
        context={}
    )

@app.get("/dead-stock-page", include_in_schema=False)
def dead_stock_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="dead_stock.html",
        context={}
    )

@app.get("/batches-page", include_in_schema=False)
def batches_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="batches.html",
        context={}
    )


@app.get("/expiry-page", include_in_schema=False)
def expiry_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="expiry.html",
        context={}
    )

@app.get("/analytics-page", include_in_schema=False)
def analytics_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="analytics.html",
        context={}
    )