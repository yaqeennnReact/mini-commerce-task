'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import {
  createAdminProduct,
  createAdminVariant,
  deleteAdminProduct,
  deleteAdminVariant,
  deleteOrder,
  getAdminProducts,
  getOrders,
  getTaxRate,
  updateAdminProduct,
  updateAdminVariant,
  updateTaxRate,
} from '../services/api';
import { registerProductImage } from '../constants/productImages';
import type { Order, Product } from '../types';

type ProductDraft = {
  name: string;
  price: string;
  description: string;
  imageUrl: string;
};

type VariantDraft = {
  name: string;
  priceDiff: string;
  stock: string;
};

type ProductCreateForm = ProductDraft & {
  variants: VariantDraft[];
};

type AdminSection = 'tax' | 'orders' | 'products';

const createEmptyVariantDraft = (): VariantDraft => ({
  name: '',
  priceDiff: '',
  stock: '0',
});

const createEmptyProductForm = (): ProductCreateForm => ({
  name: '',
  price: '',
  description: '',
  imageUrl: '',
  variants: [],
});

const AdminPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [taxInput, setTaxInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingTax, setSavingTax] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [savingProductId, setSavingProductId] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [savingVariantId, setSavingVariantId] = useState<number | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<ProductCreateForm>(() => createEmptyProductForm());
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);
  const [productImageFileName, setProductImageFileName] = useState('');
  const [productDrafts, setProductDrafts] = useState<Record<number, ProductDraft>>({});
  const [variantDrafts, setVariantDrafts] = useState<Record<number, VariantDraft>>({});
  const [newVariantForms, setNewVariantForms] = useState<Record<number, VariantDraft>>({});
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productLookup, setProductLookup] = useState<Record<number, string>>({});
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('tax');
  const productImageInputRef = useRef<HTMLInputElement | null>(null);
  const productImagePreviewRef = useRef<string | null>(null);
  const editingImagePreviewRef = useRef<string | null>(null);

  const releasePreview = (preview: string | null) => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
  };

  const updateCreateImagePreview = (nextPreview: string | null) => {
    releasePreview(productImagePreviewRef.current);
    productImagePreviewRef.current = nextPreview;
    setProductImagePreview(nextPreview);
  };

  const updateEditingImagePreview = (nextPreview: string | null) => {
    releasePreview(editingImagePreviewRef.current);
    editingImagePreviewRef.current = nextPreview;
    setEditingImagePreview(nextPreview);
  };

  const resetProductImageSelection = () => {
    setProductForm(prev => ({ ...prev, imageUrl: '' }));
    updateCreateImagePreview(null);
    setProductImageFileName('');
    if (productImageInputRef.current) {
      productImageInputRef.current.value = '';
    }
  };

  const handleOpenCreateProduct = () => {
    resetProductImageSelection();
    setProductForm(createEmptyProductForm());
    setError(null);
    setSuccess(null);
    setIsCreateProductOpen(true);
  };

  const handleCloseCreateProduct = () => {
    setIsCreateProductOpen(false);
    resetProductImageSelection();
    setProductForm(createEmptyProductForm());
  };

  const handleProductImageSelection = (
    event: ChangeEvent<HTMLInputElement>,
    options?: { targetProductId?: number },
  ) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      resetProductImageSelection();
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      input.value = '';
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('Image must be 2MB or smaller.');
      input.value = '';
      return;
    }

    const safeFileName = file.name.trim().replace(/\s+/g, '-');
    const imagePath = safeFileName.startsWith('/') ? safeFileName : `/${safeFileName}`;
    const previewUrl = URL.createObjectURL(file);

    if (options?.targetProductId) {
      updateEditingImagePreview(previewUrl);
      setProductDrafts(prev => {
        const current = prev[options.targetProductId!];
        return {
          ...prev,
          [options.targetProductId!]: {
            ...(current ?? {
              name: '',
              price: '',
              description: '',
              imageUrl: '',
            }),
            imageUrl: imagePath,
          },
        };
      });
      const targetProduct = products.find(product => product.id === options.targetProductId);
      const productKey = targetProduct ? targetProduct.name : productLookup[options.targetProductId] ?? '';
      if (productKey) {
        registerProductImage(productKey, imagePath);
      }
      const derivedFileName = imagePath.split('/').filter(Boolean).pop();
      if (derivedFileName) {
        registerProductImage(derivedFileName, imagePath);
      }
    } else {
      updateCreateImagePreview(previewUrl);
      setProductForm(prev => ({ ...prev, imageUrl: imagePath }));
      setProductImageFileName(safeFileName);
      registerProductImage(safeFileName, imagePath);
    }
    setError(null);
    setSuccess(null);
  };

  const formattedOrders = useMemo(
    () =>
      orders.map(order => ({
        ...order,
        created_at: new Date(order.created_at).toLocaleString(),
      })),
    [orders],
  );

  const syncProductsState = (list: Product[]) => {
    setProducts(list);

    const lookup: Record<number, string> = {};
    const drafts: Record<number, ProductDraft> = {};
    const variantEdits: Record<number, VariantDraft> = {};
    const variantForms: Record<number, VariantDraft> = {};
    const productIds = new Set<number>();

    list.forEach(product => {
      productIds.add(product.id);
      lookup[product.id] = product.name;
      drafts[product.id] = {
        name: product.name,
        price: product.price.toFixed(2),
        description: product.description ?? '',
        imageUrl: product.imageUrl ?? '',
      };

      variantForms[product.id] = createEmptyVariantDraft();

      if (product.imageUrl) {
        registerProductImage(product.name, product.imageUrl);
        const derivedFileName = product.imageUrl.split('/').filter(Boolean).pop();
        if (derivedFileName) {
          registerProductImage(derivedFileName, product.imageUrl);
        }
      }

      product.variants.forEach(variant => {
        variantEdits[variant.id] = {
          name: variant.name,
          priceDiff:
            variant.priceDiff === null || variant.priceDiff === undefined
              ? ''
              : variant.priceDiff.toString(),
          stock: variant.stock.toString(),
        };
      });
    });

    setProductLookup(lookup);
    setProductDrafts(drafts);
    setVariantDrafts(variantEdits);
    setNewVariantForms(variantForms);
    setEditingProductId(prev => (prev !== null && !productIds.has(prev) ? null : prev));
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [taxRate, fetchedOrders, adminProducts] = await Promise.all([
          getTaxRate(),
          getOrders(),
          getAdminProducts(),
        ]);
        setTaxInput(taxRate.toFixed(2));
        setOrders(fetchedOrders);
        syncProductsState(adminProducts);
      } catch (err) {
        console.error(err);
        setError('Failed to load admin data.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(
    () => () => {
      releasePreview(productImagePreviewRef.current);
      releasePreview(editingImagePreviewRef.current);
    },
    [],
  );

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    setError(null);
    setSuccess(null);
  };

  const handleStartEditingProduct = (productId: number) => {
    setEditingProductId(productId);
    setError(null);
    setSuccess(null);
  };

  const handleCancelEditingProduct = () => {
    setEditingProductId(null);
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    updateEditingImagePreview(null);
  }, [editingProductId]);

  const handleSaveTax = async () => {
    const parsed = Number.parseFloat(taxInput);
    if (Number.isNaN(parsed)) {
      setError('Please enter a valid percentage for the tax rate.');
      return;
    }

    if (parsed < 0) {
      setError('Tax rate cannot be negative.');
      return;
    }

    setSavingTax(true);
    setError(null);
    setSuccess(null);

    try {
      const rate = await updateTaxRate(parsed);
      setTaxInput(rate.toFixed(2));
      setSuccess('Tax rate updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Unable to update the tax rate.');
    } finally {
      setSavingTax(false);
    }
  };

  const refreshAdminData = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const [latestRate, latestOrders, adminProducts] = await Promise.all([
        getTaxRate(),
        getOrders(),
        getAdminProducts(),
      ]);
      setTaxInput(latestRate.toFixed(2));
      setOrders(latestOrders);
      syncProductsState(adminProducts);
    } catch (err) {
      console.error(err);
      setError('Failed to refresh admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this order? This cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    setDeletingOrderId(orderId);
    setError(null);
    setSuccess(null);

    try {
      await deleteOrder(orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setSuccess('Order deleted successfully.');
    } catch (err) {
      console.error(err);
      setError('Unable to delete the order.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleProductDraftChange = (
    productId: number,
    field: keyof ProductDraft,
    value: string,
  ) => {
    setProductDrafts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
    setError(null);
    setSuccess(null);
  };

  const handleVariantDraftChange = (
    variantId: number,
    field: keyof VariantDraft,
    value: string,
  ) => {
    setVariantDrafts(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }));
    setError(null);
    setSuccess(null);
  };

  const handleNewVariantFormChange = (
    productId: number,
    field: keyof VariantDraft,
    value: string,
  ) => {
    setNewVariantForms(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? createEmptyVariantDraft()),
        [field]: value,
      },
    }));
    setError(null);
    setSuccess(null);
  };

  const handleNewProductVariantChange = (
    index: number,
    field: keyof VariantDraft,
    value: string,
  ) => {
    setProductForm(prev => {
      const nextVariants = prev.variants.map((variant, idx) =>
        idx === index ? { ...variant, [field]: value } : variant,
      );
      return {
        ...prev,
        variants: nextVariants,
      };
    });
    setError(null);
    setSuccess(null);
  };

  const handleAddProductVariantRow = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, createEmptyVariantDraft()],
    }));
    setError(null);
    setSuccess(null);
  };

  const handleRemoveProductVariantRow = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
    setError(null);
    setSuccess(null);
  };

  const handleCreateProduct = async () => {
    const trimmedName = productForm.name.trim();
    const parsedPrice = Number(productForm.price);

    if (!trimmedName) {
      setError('Product name is required.');
      return;
    }

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid product price.');
      return;
    }

    const variantPayloads: Array<{ name: string; stock: number; priceDiff?: number }> = [];

    for (let index = 0; index < productForm.variants.length; index += 1) {
      const draft = productForm.variants[index];
      const trimmedVariantName = draft.name.trim();
      const hasAnyField =
        trimmedVariantName !== '' || draft.priceDiff.trim() !== '' || draft.stock.trim() !== '';

      if (!hasAnyField) {
        continue;
      }

      if (!trimmedVariantName) {
        setError('Variant name is required when providing price or stock.');
        return;
      }

      const stockValue = draft.stock.trim() === '' ? 0 : Number(draft.stock);
      if (!Number.isFinite(stockValue) || stockValue < 0) {
        setError('Variant stock must be zero or greater.');
        return;
      }

      const priceDiffValue =
        draft.priceDiff.trim() === '' ? undefined : Number(draft.priceDiff);
      if (priceDiffValue !== undefined && !Number.isFinite(priceDiffValue)) {
        setError('Variant price must be a valid number.');
        return;
      }

      variantPayloads.push({
        name: trimmedVariantName,
        stock: stockValue,
        priceDiff: priceDiffValue,
      });
    }

    setCreatingProduct(true);
    setError(null);
    setSuccess(null);

    try {
      const imageUrlValue = productForm.imageUrl.trim();
      const created = await createAdminProduct({
        name: trimmedName,
        price: parsedPrice,
        description: productForm.description.trim() || undefined,
        imageUrl: imageUrlValue || undefined,
        variants: variantPayloads.length > 0 ? variantPayloads : undefined,
      });

      const nextProducts = [...products, created].sort((a, b) => a.id - b.id);
      syncProductsState(nextProducts);
      if (imageUrlValue) {
        registerProductImage(trimmedName, imageUrlValue);
        const derivedFileName = imageUrlValue.split('/').filter(Boolean).pop();
        if (derivedFileName) {
          registerProductImage(derivedFileName, imageUrlValue);
        }
      }
      setEditingProductId(created.id);
      handleCloseCreateProduct();
      setSuccess('Product created successfully.');
    } catch (err) {
      console.error(err);
      setError('Unable to create product.');
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleUpdateProduct = async (productId: number) => {
    const draft = productDrafts[productId];
    const original = products.find(product => product.id === productId);

    if (!draft || !original) {
      return;
    }

    const trimmedName = draft.name.trim();
    const parsedPrice = Number(draft.price);

    if (!trimmedName) {
      setError('Product name is required.');
      return;
    }

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please enter a valid product price.');
      return;
    }

    const imageUrlValue = draft.imageUrl.trim();

    const payload = {
      name: trimmedName,
      price: parsedPrice,
      description: draft.description.trim() || undefined,
      imageUrl: imageUrlValue || undefined,
    };

    setSavingProductId(productId);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateAdminProduct(productId, payload);
      const nextProducts = products.map(product => (product.id === productId ? updated : product));
      syncProductsState(nextProducts);
      if (imageUrlValue) {
        registerProductImage(trimmedName, imageUrlValue);
        const derivedFileName = imageUrlValue.split('/').filter(Boolean).pop();
        if (derivedFileName) {
          registerProductImage(derivedFileName, imageUrlValue);
        }
      }
      setSuccess('Product updated successfully.');
      setEditingProductId(null);
    } catch (err) {
      console.error(err);
      setError('Unable to update product.');
    } finally {
      setSavingProductId(null);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    const confirmDelete = window.confirm('Delete this product and all of its variants?');
    if (!confirmDelete) {
      return;
    }

    setDeletingProductId(productId);
    setError(null);
    setSuccess(null);

    try {
      await deleteAdminProduct(productId);
      const nextProducts = products.filter(product => product.id !== productId);
      syncProductsState(nextProducts);
      setEditingProductId(prev => (prev === productId ? null : prev));
      setSuccess('Product deleted successfully.');
    } catch (err) {
      console.error(err);
      setError('Unable to delete product.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleAddVariant = async (productId: number) => {
    const form = newVariantForms[productId] ?? createEmptyVariantDraft();
    const trimmedName = form.name.trim();
    const stockValue = form.stock.trim() === '' ? 0 : Number(form.stock);
    const priceDiffValue = form.priceDiff.trim() === '' ? undefined : Number(form.priceDiff);

    if (!trimmedName) {
      setError('Variant name is required.');
      return;
    }

    if (!Number.isFinite(stockValue) || stockValue < 0) {
      setError('Stock must be zero or greater.');
      return;
    }

    if (priceDiffValue !== undefined && !Number.isFinite(priceDiffValue)) {
      setError('Variant price must be a valid number.');
      return;
    }

    setSavingVariantId(-productId);
    setError(null);
    setSuccess(null);

    try {
      const updated = await createAdminVariant(productId, {
        name: trimmedName,
        stock: stockValue,
        priceDiff: priceDiffValue,
      });

      const nextProducts = products.map(product => (product.id === productId ? updated : product));
      syncProductsState(nextProducts);
      setSuccess('Variant added successfully.');
    } catch (err) {
      console.error(err);
      setError('Unable to add variant.');
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleUpdateVariant = async (productId: number, variantId: number) => {
    const draft = variantDrafts[variantId];
    if (!draft) {
      return;
    }

    const trimmedName = draft.name.trim();
    const stockValue = draft.stock.trim() === '' ? 0 : Number(draft.stock);
    const priceDiffValue = draft.priceDiff.trim() === '' ? undefined : Number(draft.priceDiff);

    if (!trimmedName) {
      setError('Variant name is required.');
      return;
    }

    if (!Number.isFinite(stockValue) || stockValue < 0) {
      setError('Stock must be zero or greater.');
      return;
    }

    if (priceDiffValue !== undefined && !Number.isFinite(priceDiffValue)) {
      setError('Variant price must be a valid number.');
      return;
    }

    setSavingVariantId(variantId);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateAdminVariant(productId, variantId, {
        name: trimmedName,
        stock: stockValue,
        priceDiff: priceDiffValue,
      });

      const nextProducts = products.map(product => (product.id === productId ? updated : product));
      syncProductsState(nextProducts);
      setSuccess('Variant updated successfully.');
    } catch (err) {
      console.error(err);
      setError('Unable to update variant.');
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleDeleteVariant = async (productId: number, variantId: number) => {
    const confirmDelete = window.confirm('Delete this variant?');
    if (!confirmDelete) {
      return;
    }

    setDeletingVariantId(variantId);
    setError(null);
    setSuccess(null);

    try {
      await deleteAdminVariant(productId, variantId);
      const nextProducts = products.map(product =>
        product.id === productId
          ? {
              ...product,
              variants: product.variants.filter(variant => variant.id !== variantId),
            }
          : product,
      );
      syncProductsState(nextProducts);
      setSuccess('Variant deleted successfully.');
    } catch (err) {
      console.error(err);
      setError('Unable to delete variant.');
    } finally {
      setDeletingVariantId(null);
    }
  };

  const resolveProductName = (item: Order['items'][number]) =>
    item.product_name || productLookup[item.product_id] || `Product #${item.product_id}`;

  const editingProduct = editingProductId !== null ? products.find(product => product.id === editingProductId) : null;
  const editingDraft = editingProduct ? productDrafts[editingProduct.id] : undefined;
  const editingVariantForm = editingProduct ? newVariantForms[editingProduct.id] : undefined;

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-header">
            <h1>Admin Panel</h1>
          </div>
          <nav className="admin-nav">
            <button
              type="button"
              className={`admin-nav-item${activeSection === 'tax' ? ' active' : ''}`}
              onClick={() => handleSectionChange('tax')}
            >
              Tax Rate (%)
            </button>
            <button
              type="button"
              className={`admin-nav-item${activeSection === 'orders' ? ' active' : ''}`}
              onClick={() => handleSectionChange('orders')}
            >
              Orders
            </button>
            <button
              type="button"
              className={`admin-nav-item${activeSection === 'products' ? ' active' : ''}`}
              onClick={() => handleSectionChange('products')}
            >
              Products & Variants
            </button>
          </nav>
        </aside>

        <main className="admin-content">
          {error && <p className="admin-error admin-message">{error}</p>}
          {success && <p className="admin-success admin-message">{success}</p>}

          {activeSection === 'tax' && (
            <section className="admin-card">
              <header>
                <h2>Tax Rate (%)</h2>
                <p>Percentage applied to order subtotals before checkout.</p>
              </header>
              <div className="admin-grid">
                <div className="admin-tile">
                  <div className="tax-form">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxInput}
                      onChange={(event) => {
                        setTaxInput(event.target.value);
                        setSuccess(null);
                      }}
                    />
                    <button onClick={handleSaveTax} disabled={savingTax}>
                      {savingTax ? 'Saving...' : 'Save Tax Rate'}
                    </button>
                  </div>
                  <button className="secondary" onClick={refreshAdminData} disabled={loading}>
                    Refresh Data
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'orders' && (
            <section className="admin-card">
              <header>
                <h2>Orders</h2>
                <p>{orders.length} order(s) stored</p>
              </header>

              {loading ? (
                <p>Loading orders...</p>
              ) : formattedOrders.length === 0 ? (
                <p>No orders yet.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Subtotal</th>
                        <th>Tax Amount</th>
                        <th>Total</th>
                        <th>Created</th>
                        <th>Items</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formattedOrders.map(order => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.customer_name}</td>
                          <td>JOD {order.subtotal.toFixed(2)}</td>
                          <td>JOD {order.tax.toFixed(2)}</td>
                          <td>JOD {order.total.toFixed(2)}</td>
                          <td>{order.created_at}</td>
                          <td>
                            <ul>
                              {order.items.map(item => (
                                <li key={item.id}>
                                  {item.qty} x {resolveProductName(item)}
                                  {item.variant_id ? ` (Variant #${item.variant_id})` : ''}
                                  {' - JOD '}{item.total_price.toFixed(2)}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>
                            <button
                              className="danger"
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={deletingOrderId === order.id}
                            >
                              {deletingOrderId === order.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === 'products' && (
            <section className={`admin-card${isCreateProductOpen ? ' is-fullscreen' : ''}`}>
              {!isCreateProductOpen && (
                <>
                  <header>
                    <h2>Products & Variants</h2>
                    <p>Create new products, adjust details, and manage available variants.</p>
                  </header>

                  <div className="product-admin-toolbar">
                    <button type="button" onClick={handleOpenCreateProduct}>
                      Add Product
                    </button>
                  </div>

                  <div className="product-admin">
                    <div className="product-list">
                      {products.length === 0 ? (
                        <p className="muted">No products in the catalog yet.</p>
                      ) : (
                        products.map(product => {
                          const isEditing = editingProductId === product.id;

                          return (
                            <div key={product.id} className={`product-entry${isEditing ? ' is-active' : ''}`}>
                              <div className="product-entry-main">
                                <h3>{product.name}</h3>
                                <span className="product-entry-price">{`JOD ${product.price.toFixed(2)}`}</span>
                              </div>
                              <div className="product-entry-actions">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditingProduct(product.id)}
                                  disabled={isEditing}
                                >
                                  {isEditing ? 'Editing' : 'Edit'}
                                </button>
                                <button
                                  type="button"
                                  className="danger"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={deletingProductId === product.id}
                                >
                                  {deletingProductId === product.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="product-management">
                      <div className="product-editor">
                        {editingProduct && editingDraft ? (
                          <>
                            <div className="product-editor-header">
                              <div>
                                <h3>Edit Product</h3>
                                <p className="muted">
                                  #{editingProduct.id} {editingProduct.name}
                                </p>
                              </div>
                              <button type="button" className="link-button" onClick={handleCancelEditingProduct}>
                                Close
                              </button>
                            </div>

                            <div className="product-edit-grid">
                              <label>
                                <span>Name</span>
                                <input
                                  value={editingDraft.name}
                                  onChange={(event) =>
                                    handleProductDraftChange(editingProduct.id, 'name', event.target.value)
                                  }
                                />
                              </label>
                              <label>
                                <span>Base Price</span>
                                <input
                                  type="number"
                                  value={editingDraft.price}
                                  onChange={(event) =>
                                    handleProductDraftChange(editingProduct.id, 'price', event.target.value)
                                  }
                                />
                              </label>
                              <label className="wide">
                                <span>Replace Image</span>
                                <div className="image-upload compact">
                                  <label className="image-upload-cta" htmlFor="editing-product-image-input">
                                    <span>Choose file</span>
                                    <input
                                      id="editing-product-image-input"
                                      type="file"
                                      accept="image/*"
                                      onChange={(event) =>
                                        handleProductImageSelection(event, {
                                          targetProductId: editingProduct.id,
                                        })
                                      }
                                    />
                                  </label>
                                  {editingImagePreview && (
                                    <img className="image-preview" src={editingImagePreview} alt="Product preview" />
                                  )}
                                </div>
                              </label>
                              <label>
                                <span>Image URL</span>
                                <input
                                  value={editingDraft.imageUrl}
                                  onChange={(event) =>
                                    handleProductDraftChange(editingProduct.id, 'imageUrl', event.target.value)
                                  }
                                />
                              </label>
                              <label className="wide">
                                <span>Description</span>
                                <textarea
                                  value={editingDraft.description}
                                  onChange={(event) =>
                                    handleProductDraftChange(editingProduct.id, 'description', event.target.value)
                                  }
                                />
                              </label>
                            </div>

                            <div className="product-editor-footer">
                              <button
                                type="button"
                                onClick={() => handleUpdateProduct(editingProduct.id)}
                                disabled={savingProductId === editingProduct.id}
                              >
                                {savingProductId === editingProduct.id ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => handleDeleteProduct(editingProduct.id)}
                                disabled={deletingProductId === editingProduct.id}
                              >
                                {deletingProductId === editingProduct.id ? 'Deleting...' : 'Delete Product'}
                              </button>
                            </div>

                            <div className="variant-section">
                              <h4>Variants</h4>
                              {editingProduct.variants.length === 0 ? (
                                <p className="muted">No variants yet.</p>
                              ) : (
                                <ul className="variant-list">
                                  {editingProduct.variants.map(variant => {
                                    const variantDraft = variantDrafts[variant.id];
                                    return (
                                      <li key={variant.id}>
                                        {variantDraft && (
                                          <div className="variant-row">
                                            <input
                                              value={variantDraft.name}
                                              onChange={(event) =>
                                                handleVariantDraftChange(variant.id, 'name', event.target.value)
                                              }
                                            />
                                            <input
                                              type="number"
                                              placeholder="Variant price"
                                              value={variantDraft.priceDiff}
                                              onChange={(event) =>
                                                handleVariantDraftChange(variant.id, 'priceDiff', event.target.value)
                                              }
                                            />
                                            <input
                                              type="number"
                                              placeholder="Stock"
                                              value={variantDraft.stock}
                                              onChange={(event) =>
                                                handleVariantDraftChange(variant.id, 'stock', event.target.value)
                                              }
                                            />
                                            <div className="variant-actions">
                                              <button
                                                type="button"
                                                onClick={() => handleUpdateVariant(editingProduct.id, variant.id)}
                                                disabled={savingVariantId === variant.id}
                                              >
                                                {savingVariantId === variant.id ? 'Saving...' : 'Save'}
                                              </button>
                                              <button
                                                type="button"
                                                className="danger"
                                                onClick={() => handleDeleteVariant(editingProduct.id, variant.id)}
                                                disabled={deletingVariantId === variant.id}
                                              >
                                                {deletingVariantId === variant.id ? 'Deleting...' : 'Delete'}
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}

                              <div className="variant-add">
                                <h5>Add Variant</h5>
                                <div className="variant-row">
                                  <input
                                    placeholder="Name"
                                    value={editingVariantForm?.name ?? ''}
                                    onChange={(event) =>
                                      handleNewVariantFormChange(editingProduct.id, 'name', event.target.value)
                                    }
                                  />
                                  <input
                                    type="number"
                                    placeholder="Variant price"
                                    value={editingVariantForm?.priceDiff ?? ''}
                                    onChange={(event) =>
                                      handleNewVariantFormChange(editingProduct.id, 'priceDiff', event.target.value)
                                    }
                                  />
                                  <input
                                    type="number"
                                    placeholder="Stock"
                                    value={editingVariantForm?.stock ?? ''}
                                    onChange={(event) =>
                                      handleNewVariantFormChange(editingProduct.id, 'stock', event.target.value)
                                    }
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleAddVariant(editingProduct.id)}
                                    disabled={savingVariantId === -editingProduct.id}
                                  >
                                    {savingVariantId === -editingProduct.id ? 'Saving...' : 'Add'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="product-editor-empty">
                            <p>Select a product to edit details and manage variants.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isCreateProductOpen && (
                <div className="product-create-full">
                  <div className="product-create-header">
                    <div>
                      <h2>Add Product</h2>
                      <p className="muted">Fill out the details below to add a new product to the catalog.</p>
                    </div>
                    <button type="button" className="link-button" onClick={handleCloseCreateProduct}>
                      Back to products
                    </button>
                  </div>
                  <div className="product-create">
                    <div className="product-form">
                      <input
                        placeholder="Product name"
                        value={productForm.name}
                        onChange={(event) => {
                          setProductForm(prev => ({ ...prev, name: event.target.value }));
                          setError(null);
                          setSuccess(null);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Base price"
                        value={productForm.price}
                        onChange={(event) => {
                          setProductForm(prev => ({ ...prev, price: event.target.value }));
                          setError(null);
                          setSuccess(null);
                        }}
                      />
                      <div className="image-upload">
                        <label className="image-upload-cta" htmlFor="product-image-input">
                          <span>{productImageFileName ? 'Change image' : 'Upload image'}</span>
                          <input
                            id="product-image-input"
                            ref={productImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(event) => handleProductImageSelection(event)}
                          />
                        </label>
                        <div className="image-upload-body">
                          {productImagePreview ? (
                            <img className="image-preview" src={productImagePreview} alt="Product preview" />
                          ) : (
                            <p className="image-upload-hint">Select a JPG or PNG up to 2MB; we will use /filename.ext as the product image URL.</p>
                          )}
                          {productImageFileName && (
                            <p className="image-upload-filename">{productImageFileName}</p>
                          )}
                        </div>
                        {productImagePreview && (
                          <button type="button" className="link-button" onClick={resetProductImageSelection}>
                            Remove image
                          </button>
                        )}
                      </div>
                      <input
                        placeholder="Image URL (optional)"
                        value={productForm.imageUrl}
                        onChange={(event) => {
                          setProductForm(prev => ({ ...prev, imageUrl: event.target.value }));
                          setError(null);
                          setSuccess(null);
                        }}
                      />
                      <textarea
                        placeholder="Description"
                        value={productForm.description}
                        onChange={(event) => {
                          setProductForm(prev => ({ ...prev, description: event.target.value }));
                          setError(null);
                          setSuccess(null);
                        }}
                      />
                      <div className="product-create-variants">
                        <div className="product-create-variants-header">
                          <h4>Initial Variants</h4>
                          <p className="muted">Optional: add starting variants for this product.</p>
                        </div>
                        {productForm.variants.length === 0 ? (
                          <p className="muted">No variants yet.</p>
                        ) : (
                          productForm.variants.map((variant, index) => (
                            <div key={`new-variant-${index}`} className="product-create-variant-row">
                              <input
                                placeholder="Name"
                                value={variant.name}
                                onChange={(event) =>
                                  handleNewProductVariantChange(index, 'name', event.target.value)
                                }
                              />
                                     <input
                                       type="number"
                                       placeholder="Variant price"
                                value={variant.priceDiff}
                                onChange={(event) =>
                                  handleNewProductVariantChange(index, 'priceDiff', event.target.value)
                                }
                              />
                              <input
                                type="number"
                                placeholder="Stock"
                                value={variant.stock}
                                onChange={(event) =>
                                  handleNewProductVariantChange(index, 'stock', event.target.value)
                                }
                              />
                              <button
                                type="button"
                                className="link-button"
                                onClick={() => handleRemoveProductVariantRow(index)}
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                        <button type="button" className="secondary" onClick={handleAddProductVariantRow}>
                          Add Variant
                        </button>
                      </div>
                      <button type="button" onClick={handleCreateProduct} disabled={creatingProduct}>
                        {creatingProduct ? 'Saving...' : 'Create Product'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
