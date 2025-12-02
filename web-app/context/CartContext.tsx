import { createContext, useContext, useState, ReactNode } from 'react';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  variantId?: number | null;
  variantName?: string | null;
  stock?: number | null;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setItems(prev => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setItems(prev => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
