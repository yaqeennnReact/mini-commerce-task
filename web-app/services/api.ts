import axios from 'axios';

import type { Order, Product } from '../types';

export interface CheckoutItem {
  productId: number;
  quantity: number;
  price: number;
  variantId?: number | null;
  name?: string;
}

export interface CheckoutResponse {
  message: string;
  orderId: number;
  total: number;
  items: number;
}

export interface VariantPayload {
  name: string;
  priceDiff?: number;
  stock?: number;
}

export interface ProductPayload {
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  variants?: VariantPayload[];
}

const catalogBaseURL = process.env.NEXT_PUBLIC_CATALOG_API_URL ?? 'http://localhost:3000';
const salesBaseURL = process.env.NEXT_PUBLIC_SALES_API_URL ?? 'http://localhost:8000';

const catalogApi = axios.create({
  baseURL: catalogBaseURL,
});

const salesApi = axios.create({
  baseURL: salesBaseURL,
});

export const getProducts = async () => {
  try {
    const res = await catalogApi.get('/products');
    return res.data as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getTaxRate = async (): Promise<number> => {
  try {
    const res = await salesApi.get('/admin/tax');
    return res.data.amount ?? 0;
  } catch (error) {
    console.error('Error fetching tax rate:', error);
    return 0;
  }
};

export const updateTaxRate = async (amount: number): Promise<number> => {
  try {
    const res = await salesApi.put('/admin/tax', { amount });
    return res.data.amount ?? amount;
  } catch (error) {
    console.error('Error updating tax rate:', error);
    throw error;
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const res = await salesApi.get('/orders');
    return res.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const deleteOrder = async (orderId: number): Promise<void> => {
  try {
    await salesApi.delete(`/orders/${orderId}`);
  } catch (error) {
    console.error(`Error deleting order ${orderId}:`, error);
    throw error;
  }
};

export const createOrder = async (items: CheckoutItem[]): Promise<CheckoutResponse> => {
  try {
    const res = await salesApi.post('/orders', { items });
    return res.data as CheckoutResponse;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getAdminProducts = async (): Promise<Product[]> => {
  try {
    const res = await catalogApi.get('/admin/products');
    return res.data as Product[];
  } catch (error) {
    console.error('Error fetching admin products:', error);
    throw error;
  }
};

export const createAdminProduct = async (payload: ProductPayload): Promise<Product> => {
  try {
    const res = await catalogApi.post('/admin/products', payload);
    return res.data as Product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const updateAdminProduct = async (
  productId: number,
  payload: Partial<ProductPayload>,
): Promise<Product> => {
  try {
    const res = await catalogApi.put(`/admin/products/${productId}`, payload);
    return res.data as Product;
  } catch (error) {
    console.error(`Error updating product ${productId}:`, error);
    throw error;
  }
};

export const deleteAdminProduct = async (productId: number): Promise<void> => {
  try {
    await catalogApi.delete(`/admin/products/${productId}`);
  } catch (error) {
    console.error(`Error deleting product ${productId}:`, error);
    throw error;
  }
};

export const createAdminVariant = async (
  productId: number,
  payload: VariantPayload,
): Promise<Product> => {
  try {
    const res = await catalogApi.post(`/admin/products/${productId}/variants`, payload);
    return res.data as Product;
  } catch (error) {
    console.error(`Error creating variant for product ${productId}:`, error);
    throw error;
  }
};

export const updateAdminVariant = async (
  productId: number,
  variantId: number,
  payload: Partial<VariantPayload>,
): Promise<Product> => {
  try {
    const res = await catalogApi.put(`/admin/products/${productId}/variants/${variantId}`, payload);
    return res.data as Product;
  } catch (error) {
    console.error(`Error updating variant ${variantId} for product ${productId}:`, error);
    throw error;
  }
};

export const deleteAdminVariant = async (productId: number, variantId: number): Promise<void> => {
  try {
    await catalogApi.delete(`/admin/products/${productId}/variants/${variantId}`);
  } catch (error) {
    console.error(`Error deleting variant ${variantId} for product ${productId}:`, error);
    throw error;
  }
};
