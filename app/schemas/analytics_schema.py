from pydantic import BaseModel


class SalesSummary(BaseModel):
    total_sales: int
    total_revenue: float
    average_order_value: float


class DailySalesResponse(BaseModel):
    date: str
    total_sales: int
    revenue: float


class MonthlySalesResponse(BaseModel):
    year: int
    month: int
    total_sales: int
    revenue: float


class BestSellingProductResponse(BaseModel):
    product_id: int
    product_name: str
    units_sold: int
    total_revenue: float