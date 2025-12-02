'use client';

import { useEffect, useMemo, useState } from 'react';

import { useCart } from '../context/CartContext';
import { createOrder, getTaxRate } from '../services/api';
import type { CheckoutItem } from '../services/api';

import styles from './CartOverlay.module.css';

type CartOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CartOverlay: React.FC<CartOverlayProps> = ({ isOpen, onClose }) => {
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
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    const loadTax = async () => {
      setTaxLoading(true);
      try {
        const amount = await getTaxRate();
        if (!cancelled) {
          setTaxRate(Number.isFinite(amount) ? amount : 0);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setTaxRate(0);
        }
      } finally {
        if (!cancelled) {
          setTaxLoading(false);
        }
      }
    };

    loadTax();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      window.alert('Cart is empty!');
      return;
    }

    setLoading(true);

    try {
      const checkoutItems: CheckoutItem[] = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        variantId: item.variantId ?? null,
      }));

      const response = await createOrder(checkoutItems);
      clearCart();
      window.alert('Order submitted successfully!');
      console.log('Order submitted', response);
      onClose();
    } catch (error) {
      console.error(error);
      window.alert('Failed to submit order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        <header className={styles.header}>
          <h2>Cart Summary</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close cart">
            ×
          </button>
        </header>

        <div className={styles.body}>
          {items.length === 0 ? (
            <p className={styles.empty}>Your cart is empty. Start exploring our products.</p>
          ) : (
            <ul className={styles.list}>
              {items.map((item, index) => (
                <li key={`${item.productId}-${index}`}>
                  <div className={styles.itemRow}>
                    <div>
                      <p className={styles.itemName}>{item.name}</p>
                      {item.variantName && <span className={styles.itemMeta}>{item.variantName}</span>}
                      <span className={styles.itemMeta}>Qty {item.quantity}</span>
                      {typeof item.stock === 'number' && (
                        <span className={styles.itemMeta}>Stock remaining: {item.stock}</span>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      <span className={styles.itemPrice}>{`JOD ${(item.price * item.quantity).toFixed(2)}`}</span>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => removeFromCart(index)}
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className={styles.removeButtonIcon}
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>JOD {subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>{taxLabel}</span>
            <span>{taxLoading ? 'Loading...' : `JOD ${taxAmount.toFixed(2)}`}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Total</span>
            <strong>JOD {total.toFixed(2)}</strong>
          </div>
          <button
            className={styles.checkoutButton}
            onClick={handleCheckout}
            disabled={loading || taxLoading || items.length === 0}
          >
            {loading ? 'Processing...' : 'Checkout'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CartOverlay;
