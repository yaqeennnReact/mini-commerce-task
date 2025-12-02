export interface Variant {
  id: number;
  name: string;
  priceDiff?: number;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  variants: Variant[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  variant_id: number | null;
  qty: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: number;
  customer_name: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  items: OrderItem[];
}
