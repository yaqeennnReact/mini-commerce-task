import React, { useMemo, useState } from 'react';

import { BUILT_IN_PRODUCT_IMAGES } from '../constants/productImages';
import { useCart } from '../context/CartContext';
import { Product, Variant } from '../types';

import styles from './ProductCard.module.css';

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const { addToCart } = useCart();

  const getPriceForVariant = (variant: Variant | null) => {
    if (!variant) {
      return product.price;
    }

    if (typeof variant.priceDiff === 'number') {
      return variant.priceDiff;
    }

    return product.price;
  };

  const formatPrice = (value: number) => value.toFixed(2);

  const currentPriceValue = useMemo(
    () => getPriceForVariant(selectedVariant),
    [selectedVariant, product.price]
  );

  const currentPrice = formatPrice(currentPriceValue);

  const productInitial = product.name.charAt(0).toUpperCase();
  const resolvedImage = useMemo(
    () =>  BUILT_IN_PRODUCT_IMAGES[product.name] ?? product.imageUrl ?? null,
    [product.imageUrl, product.name]
  );

  const handleAddToCart = () => {
    if (
      product.variants.length > 0 &&
      (!selectedVariant || selectedVariant.stock <= 0)
    ) {
      return;
    }

    const priceToUse = currentPriceValue;

    const basePayload = {
      productId: product.id,
      name: product.name,
      price: priceToUse,
      quantity: 1,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      stock: selectedVariant?.stock ?? null,
    };

    addToCart(basePayload);
  };

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {resolvedImage ? (
          <img className={styles.image} src={resolvedImage} alt={product.name} />
        ) : (
          <div className={styles.placeholder}>{productInitial}</div>
        )}
      </div>

      <h2 className={styles.title}>{product.name}</h2>
      {product.description && <p className={styles.description}>{product.description}</p>}

      <div className={styles.priceRow}>
        <span className={styles.priceLabel}>Price</span>
        <span className={styles.priceValue}>{`JOD ${currentPrice}`}</span>
      </div>

      {product.variants.length > 0 && (
        <>
          <select
            value={selectedVariant?.id ?? ''}
            onChange={(event) => {
              const variant = product.variants.find((item) => item.id === Number(event.target.value));
              setSelectedVariant(variant ?? null);
            }}
            className={styles.variantSelect}
          >
            <option value="">Select a variant</option>
            {product.variants.map((variant) => {
              const variantPrice = formatPrice(getPriceForVariant(variant));
              const isOutOfStock = variant.stock <= 0;
              const availabilityLabel = variant.stock > 0 ? 'In stock' : 'Not available';

              return (
                <option key={variant.id} value={variant.id} disabled={isOutOfStock}>
                  {variant.name} · {availabilityLabel} · JOD {variantPrice}
                </option>
              );
            })}
          </select>
          {selectedVariant && (
            <span className={styles.variantHint}>
              {selectedVariant.stock > 0 ? 'In stock' : 'Not available'}
            </span>
          )}
        </>
      )}

      <button
        className={styles.button}
        onClick={handleAddToCart}
        disabled={Boolean(
          product.variants.length > 0 &&
          (!selectedVariant || selectedVariant.stock <= 0)
        )}
      >
        Add to Cart
      </button>
    </article>
  );
};

export default ProductCard;
