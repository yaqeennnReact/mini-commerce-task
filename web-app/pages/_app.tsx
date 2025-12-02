'use client';

import type { AppProps } from 'next/app';
import Link from 'next/link';
import { useState } from 'react';

import CartOverlay from '../components/CartOverlay';
import { CartProvider, useCart } from '../context/CartContext';
import '../styles/globals.css';

function Layout({ children }: { children: React.ReactNode }) {
  const { items } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const count = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <header className="site-header">
        <div className="header-left">
          <Link href="/" className="brand">Electronics Store</Link>
          <nav className="nav-links">
            <Link href="/admin" className="nav-link">Admin</Link>
          </nav>
        </div>
        <button className="cart-toggle" onClick={() => setIsCartOpen(true)}>
          Cart ({count})
        </button>
      </header>
      {children}
      <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </CartProvider>
  );
}
