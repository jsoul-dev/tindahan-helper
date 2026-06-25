import React from 'react';
import type { Product } from '../types';
import { formatCategoryLabel } from '../categoryLabels';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onViewImage: (imagePath: string, name: string, location: string) => void;
  onViewNote: (notes: string, name: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onAddToCart,
  onViewImage,
  onViewNote,
}) => {
  return (
    <div className="product-card">
      {/* Product Image Section */}
      <div className="product-image-container">
        {product.imagePath ? (
          <img
            src={product.imagePath}
            alt={product.name}
            className="product-img"
            onClick={() => onViewImage(product.imagePath!, product.name, "Product Image")}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <div className="product-img-fallback">
            <svg
              className="fallback-icon"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
            <span className="fallback-text">No Product Photo</span>
          </div>
        )}

      </div>
      
      <span className="product-category-badge">{formatCategoryLabel(product.category)}</span>
      {product.notes && (
        <div className="product-note-badge-wrapper">
          <button
            type="button"
            className="product-note-badge"
            title="View Product Notes"
            onClick={(e) => {
              e.stopPropagation();
              onViewNote(product.notes || '', product.name);
            }}
          >
            <svg className="note-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
              <path d="M15 3v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
            <span className="note-text">Note</span>
          </button>
          <div className="product-note-tooltip">
            {product.notes}
          </div>
        </div>
      )}

      {/* Product Information Section */}
      <div className="product-info">
        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>

        <div className="price-section">
          <span className="base-price">₱{product.price.toFixed(2)}</span>
          {product.specialPrices && product.specialPrices.length > 0 && (
            <div className="special-price-container">
              {product.specialPrices.map((sp, idx) => (
                <span key={idx} className="special-price-badge">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Promo: {sp.quantity} pcs for ₱{sp.price.toFixed(2)}
                </span>
              ))}
            </div>
          )}
        </div>



        {/* View Location Map trigger button */}
        <div className="shelf-image-action-container">
          {product.locationImagePath ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onViewImage(product.locationImagePath!, product.name, `Shelf Location: ${product.location || 'Aisle'}`)}
              style={{ 
                width: '100%', 
                fontSize: '0.8rem', 
                padding: '0.4rem', 
                justifyContent: 'center', 
                gap: '0.35rem', 
                marginBottom: '0',
                borderColor: 'var(--primary)',
                color: 'var(--primary)'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" x2="9" y1="3" y2="18" />
                <line x1="15" x2="15" y1="6" y2="21" />
              </svg>
              View Shelf Image
            </button>
          ) : (
            <div 
              className="shelf-image-fallback"
              style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                textAlign: 'center', 
                marginBottom: '0', 
                padding: '0.35rem',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border)'
              }}
            >
              No Shelf Image uploaded
            </div>
          )}
        </div>

        {/* Storefront Actions */}
        <div className="card-actions">
          <button
            className="btn-primary"
            onClick={() => onAddToCart(product)}
            style={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            Add to Cart
          </button>

          <button
            className="card-edit-btn"
            onClick={() => onEdit(product)}
            title="Edit Details & Photos"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
