import React, { useState, useEffect, useRef } from 'react';
import type { Product, SpecialPrice } from '../types';
import { uploadImage } from '../api';
import { ConfirmationModal } from './ConfirmationModal';
import { NO_CATEGORY_OPTION_LABEL, UNCATEGORIZED_CATEGORY } from '../categoryLabels';


interface ProductFormProps {
  product?: Product | null; // If provided, we are editing. If null, we are adding.
  categories: string[];
  onSave: (productData: Omit<Product, 'id' | 'updatedAt'> & { id?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  categories,
  onSave,
  onDelete,
  onClose,
}) => {
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const locationFileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [price, setPrice] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  
  // Dual Image states
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [locationImagePath, setLocationImagePath] = useState<string | null>(null);

  // Individual Upload indicators
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);
  const [uploadProductError, setUploadProductError] = useState<string | null>(null);
  
  const [isUploadingLocation, setIsUploadingLocation] = useState(false);
  const [uploadLocationError, setUploadLocationError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [specialPrices, setSpecialPrices] = useState<SpecialPrice[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Load product data if editing
  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category || UNCATEGORIZED_CATEGORY);
      setPrice(product.price);
      setLocation(product.location);
      setImagePath(product.imagePath);
      setLocationImagePath(product.locationImagePath || null);
      setSpecialPrices(product.specialPrices || []);
      setNotes(product.notes || '');
    } else {
      setName('');
      setCategory(UNCATEGORIZED_CATEGORY);
      setPrice('');
      setLocation('');
      setImagePath(null);
      setLocationImagePath(null);
      setSpecialPrices([]);
      setNotes('');
    }
  }, [product, categories]);

  const handleProductFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProduct(true);
    setUploadProductError(null);

    try {
      const uploadedPath = await uploadImage(file);
      setImagePath(uploadedPath);
    } catch (err: any) {
      console.error(err);
      setUploadProductError(err.message || 'Failed to upload photo. Under 5MB only.');
    } finally {
      setIsUploadingProduct(false);
    }
  };

  const handleLocationFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLocation(true);
    setUploadLocationError(null);

    try {
      const uploadedPath = await uploadImage(file);
      setLocationImagePath(uploadedPath);
    } catch (err: any) {
      console.error(err);
      setUploadLocationError(err.message || 'Failed to upload shelf image. Under 5MB only.');
    } finally {
      setIsUploadingLocation(false);
    }
  };

  const handleRemoveProductImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePath(null);
    if (productFileInputRef.current) {
      productFileInputRef.current.value = '';
    }
  };

  const handleRemoveLocationImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocationImagePath(null);
    if (locationFileInputRef.current) {
      locationFileInputRef.current.value = '';
    }
  };

  const handleAddSpecialPrice = () => {
    setSpecialPrices([...specialPrices, { quantity: 2, price: 0 }]);
  };

  const handleRemoveSpecialPrice = (index: number) => {
    setSpecialPrices(specialPrices.filter((_, idx) => idx !== index));
  };

  const handleSpecialPriceChange = (index: number, field: keyof SpecialPrice, value: number) => {
    const updated = [...specialPrices];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSpecialPrices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (price === '' || Number(price) < 0) {
      setSaveError('Please enter a valid price');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const finalCategory = isAddingCategory ? newCategory.trim() : category;
    if (!finalCategory) {
      setSaveError('Please select or specify a category');
      setIsSaving(false);
      return;
    }

    try {
      await onSave({
        id: product?.id,
        name: name.trim(),
        category: finalCategory,
        price: Number(price),
        location: location.trim(),
        imagePath,
        locationImagePath,
        specialPrices: specialPrices.filter(sp => sp.quantity > 0 && sp.price > 0),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save product details');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!product || !onDelete) return;
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!product || !onDelete) return;
    setIsDeleteConfirmOpen(false);
    setIsSaving(true);
    try {
      await onDelete(product.id);
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to delete product');
      setIsSaving(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{product ? 'Edit Product Details' : 'Add New Product'}</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {saveError && (
              <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: '500' }}>
                {saveError}
              </div>
            )}

            {/* Product Name */}
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="search"
                className="form-input"
                placeholder="e.g. Pancit Canton Extra Hot, Coke 290ml"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Category Select / Custom */}
            <div className="form-group">
              <label className="form-label">Category</label>
              {!isAddingCategory ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className="form-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value={UNCATEGORIZED_CATEGORY}>{NO_CATEGORY_OPTION_LABEL}</option>
                    {categories.filter(c => c !== UNCATEGORIZED_CATEGORY).map((cat, idx) => (
                      <option key={idx} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsAddingCategory(true)}
                  >
                    + New
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="search"
                    className="form-input"
                    placeholder="Enter new category name"
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsAddingCategory(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Retail Price & Shelf Location */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
                {product && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                    Price last updated: {product.priceUpdatedAt ? new Date(product.priceUpdatedAt).toLocaleString() : new Date(product.updatedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Shelf Location</label>
                <input
                  type="search"
                  className="form-input"
                  placeholder="e.g. Aisle 2, Bottom shelf"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
            </div>

            {/* Dual Location Image Upload Row */}
            <div className="form-row">
              {/* Product Photo Upload */}
              <div className="form-group">
                <label className="form-label">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={productFileInputRef}
                  onChange={handleProductFileChange}
                  style={{ display: 'none' }}
                />
                
                {!imagePath ? (
                  <div 
                    className="upload-container" 
                    onClick={() => !isUploadingProduct && productFileInputRef.current?.click()}
                    style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                  >
                    <div className="upload-icon">
                      {isUploadingProduct ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Uploading...</span>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        </svg>
                      )}
                    </div>
                    <div className="upload-text" style={{ fontSize: '0.78rem' }}>
                      {isUploadingProduct ? 'Saving...' : 'Add Product Photo'}
                    </div>
                    {uploadProductError && (
                      <div style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{uploadProductError}</div>
                    )}
                  </div>
                ) : (
                  <div className="upload-preview" style={{ height: '120px' }} onClick={() => productFileInputRef.current?.click()}>
                    <img src={imagePath} alt="Product preview" />
                    <button type="button" className="btn-remove-img" onClick={handleRemoveProductImage} title="Remove Photo">
                      &times;
                    </button>
                  </div>
                )}
              </div>

              {/* Shelf Location Map Upload */}
              <div className="form-group">
                <label className="form-label">Shelf Image</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={locationFileInputRef}
                  onChange={handleLocationFileChange}
                  style={{ display: 'none' }}
                />
                
                {!locationImagePath ? (
                  <div 
                    className="upload-container" 
                    onClick={() => !isUploadingLocation && locationFileInputRef.current?.click()}
                    style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                  >
                    <div className="upload-icon">
                      {isUploadingLocation ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Uploading...</span>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      )}
                    </div>
                    <div className="upload-text" style={{ fontSize: '0.78rem' }}>
                      {isUploadingLocation ? 'Saving...' : 'Add Location Image'}
                    </div>
                    {uploadLocationError && (
                      <div style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{uploadLocationError}</div>
                    )}
                  </div>
                ) : (
                  <div className="upload-preview" style={{ height: '120px' }} onClick={() => locationFileInputRef.current?.click()}>
                    <img src={locationImagePath} alt="Shelf image preview" />
                    <button type="button" className="btn-remove-img" onClick={handleRemoveLocationImage} title="Remove Shelf Image">
                      &times;
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Special Pricing Tiers */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Special Multi-Pricing / Bulk Promos</label>
              <div className="special-prices-section">
                {specialPrices.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem 0' }}>
                    No special bulk pricing configured (e.g. 5 pcs for ₱5.00).
                  </p>
                ) : (
                  specialPrices.map((sp, index) => (
                    <div key={index} className="special-price-row">
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quantity</span>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 5"
                          value={sp.quantity}
                          onChange={e => handleSpecialPriceChange(index, 'quantity', Number(e.target.value))}
                          required
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Price (₱)</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          placeholder="e.g. 5.00"
                          value={sp.price === 0 ? '' : sp.price}
                          onChange={e => handleSpecialPriceChange(index, 'price', Number(e.target.value))}
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => handleRemoveSpecialPrice(index)}
                        style={{ marginTop: '1.1rem' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  ))
                )}
                
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleAddSpecialPrice}
                  style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                >
                  + Add Bulk Price Tier
                </button>
              </div>
            </div>

            {/* Notes / Extra Info */}
            <div className="form-group" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
              <label className="form-label">Notes / Extra Info</label>
              <textarea
                className="form-input"
                placeholder="e.g. Sell for ₱5.00 to Aling Nena, or special instructions..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{ resize: 'vertical', minHeight: '60px', background: 'var(--bg-app)', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            {product && onDelete && (
              <button
                type="button"
                className="btn-danger"
                onClick={handleDelete}
                style={{ marginRight: 'auto' }}
                disabled={isSaving}
              >
                Delete Product
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving || isUploadingProduct || isUploadingLocation}>
              {isSaving ? 'Saving...' : product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
        {product && (
          <ConfirmationModal
            isOpen={isDeleteConfirmOpen}
            title="Delete Product"
            message={`Are you sure you want to delete "${product.name}"?\nThis will permanently remove the product and delete all associated photos. This action cannot be undone.`}
            confirmText="Delete Product"
            cancelText="Cancel"
            isDanger={true}
            onConfirm={handleConfirmDelete}
            onCancel={() => setIsDeleteConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
