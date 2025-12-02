'use client';

import { useEffect, useMemo, useState } from 'react';

import { useCart } from '../context/CartContext';
import { createOrder, getTaxRate } from '../services/api';
import type { CheckoutItem } from '../services/api';

export default function CartPage() {
  const { items, clearCart, removeFromCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [taxLoading, setTaxLoading] = useState(false);

  const subtotal = useMemo(
    () => {
      const raw = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return Math.round(raw * 100) / 100;
    },
    [items]
  );
  const taxAmount = useMemo(() => {
    if (!items.length) {
      return 0;
    }
    const calculated = subtotal * (taxRate / 100);
    return Math.round(calculated * 100) / 100;
  }, [items.length, subtotal, taxRate]);
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  const taxLabel = taxLoading ? 'Tax' : `Tax (${taxRate.toFixed(2)}%)`;

  useEffect(() => {
    const loadTax = async () => {
      setTaxLoading(true);
      try {
        const amount = await getTaxRate();
        setTaxRate(Number.isFinite(amount) ? amount : 0);
      } catch (error) {
        console.error(error);
        setTaxRate(0);
      } finally {
        setTaxLoading(false);
      }
    };

    loadTax();
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return alert('Cart is empty!');
    setLoading(true);
    try {
      const checkoutItems: CheckoutItem[] = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        variantId: item.variantId ?? null,
      }));

      const res = await createOrder(checkoutItems);
      console.log('Order submitted', res);
      clearCart();
      alert('Order submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to submit order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Shopping Cart</h1>
      {items.length === 0 && <p>Your cart is empty.</p>}
      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: '1rem' }}>
          <strong>{item.name}</strong>
          {item.variantName ? <em style={{ marginLeft: '0.5rem' }}>({item.variantName})</em> : null}
          <div>
            Qty {item.quantity} · JOD {item.price.toFixed(2)} each
          </div>
          {typeof item.stock === 'number' && (
            <div style={{ fontSize: '0.85rem', color: '#525252' }}>Stock remaining: {item.stock}</div>
          )}
          <button
            type="button"
            onClick={() => removeFromCart(index)}
            aria-label={`Remove ${item.name} from cart`}
            style={{
              marginTop: '0.5rem',
              border: 'none',
              background: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="currentColor"
                d="M9 3a1 1 0 0 0-1 1v1H5.5a.5.5 0 0 0 0 1H6v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6h.5a.5.5 0 0 0 0-1H16V4a1 1 0 0 0-1-1H9Zm1 2V4h4v1h-4Zm-1 2h8v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7Zm2 3a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7Zm4 0a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0v-7Z"
              />
            </svg>
          </button>
        </div>
      ))}
      <div style={{ marginTop: '1.5rem', maxWidth: '320px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span>Subtotal</span>
          <span>JOD {subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span>{taxLabel}</span>
          <span>{taxLoading ? 'Loading...' : `JOD ${taxAmount.toFixed(2)}`}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
          <span>Total</span>
          <span>JOD {total.toFixed(2)}</span>
        </div>
      </div>
      <button onClick={handleCheckout} disabled={loading || taxLoading || items.length === 0}>
        {loading ? 'Processing...' : 'Checkout'}
      </button>
    </div>
  );
}
