import React from 'react';
import type { Product, SpecialPrice, SaleRecordItem } from '../types';

interface CartPOSProps {
  cart: Record<string, number>;
  products: Product[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveFromCart: (id: string) => void;
  onCheckout: (items: SaleRecordItem[], total: number) => Promise<void>;
  onClearCart: () => void;
}

// Greedy Bulk Pricing Calculation
export function calculateItemTotal(price: number, quantity: number, specialPrices: SpecialPrice[]): { total: number; breakdown: string } {
  if (quantity <= 0) return { total: 0, breakdown: '' };
  if (!specialPrices || specialPrices.length === 0) {
    return { 
      total: price * quantity, 
      breakdown: `${quantity} pcs × ₱${price.toFixed(2)}` 
    };
  }

  // Sort rules descending by quantity to apply largest bundles first
  const sortedRules = [...specialPrices].sort((a, b) => b.quantity - a.quantity);
  
  let remaining = quantity;
  let totalCost = 0;
  const parts: string[] = [];

  for (const rule of sortedRules) {
    if (rule.quantity <= 0) continue;
    const ruleApplies = Math.floor(remaining / rule.quantity);
    if (ruleApplies > 0) {
      const partCost = ruleApplies * rule.price;
      totalCost += partCost;
      remaining = remaining % rule.quantity;
      parts.push(`${ruleApplies} bundle(s) of ${rule.quantity} (₱${rule.price.toFixed(2)} ea)`);
    }
  }

  if (remaining > 0) {
    const partCost = remaining * price;
    totalCost += partCost;
    parts.push(`${remaining} pc(s) × ₱${price.toFixed(2)}`);
  }

  return { 
    total: totalCost, 
    breakdown: parts.join(' + ') 
  };
}

export const CartPOS: React.FC<CartPOSProps> = ({
  cart,
  products,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckout,
  onClearCart,
}) => {
  const [adjustmentAmount, setAdjustmentAmount] = React.useState<number>(0);
  const [adjustmentLabel, setAdjustmentLabel] = React.useState<string>('Custom Surcharge');

  // Resolve product objects and compute prices
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find(p => p.id === id);
      if (!product) return null;
      
      const { total, breakdown } = calculateItemTotal(product.price, qty, product.specialPrices);
      return {
        product,
        quantity: qty,
        total,
        breakdown,
      };
    })
    .filter(Boolean) as { product: Product; quantity: number; total: number; breakdown: string }[];

  const grandTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const adjustedTotal = grandTotal + adjustmentAmount;

  const handleQtyChange = (id: string, val: string) => {
    const qty = parseInt(val, 10);
    if (!isNaN(qty) && qty > 0) {
      onUpdateQuantity(id, qty);
    }
  };

  const handleCheckoutSubmit = async () => {
    if (cartItems.length === 0) return;
    
    // Prepare items list for backend database
    const saleItems = cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      pricePaid: item.total
    }));

    if (adjustmentAmount !== 0) {
      saleItems.push({
        productId: 'custom_adjustment',
        name: adjustmentLabel.trim() || 'Custom Adjustment',
        quantity: 1,
        pricePaid: adjustmentAmount
      });
    }

    try {
      await onCheckout(saleItems, adjustedTotal);
      setAdjustmentAmount(0);
      setAdjustmentLabel('Custom Surcharge');
    } catch (err: any) {
      console.error(`Checkout failed: ${err.message}`);
    }
  };

  return (
    <div className="shopping-list-container">
      <div className="shopping-header">
        <h2 className="shopping-title">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--primary)', verticalAlign: 'middle' }}
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          POS Checkout Calculator
        </h2>
        {cartItems.length > 0 && (
          <button className="btn-secondary" onClick={onClearCart} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            Clear Cart
          </button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-shopping-state">
          <div className="empty-shopping-icon" style={{ color: 'var(--text-muted)' }}>
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </div>
          <h3>Your Checkout Cart is Empty</h3>
          <p style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
            Browse products on the "Shelves & Prices" page and click "Add to Cart" to build customer bills and calculate bulk discounts automatically.
          </p>
        </div>
      ) : (
        <div className="shopping-items-list">
          {cartItems.map(item => (
            <div key={item.product.id} className="shopping-item-row" style={{ opacity: 1, background: 'var(--bg-card)' }}>
              <div className="shopping-item-left" style={{ cursor: 'default' }}>
                <div className="shopping-item-info">
                  <span className="shopping-item-name">{item.product.name}</span>
                  <div className="shopping-item-details" style={{ marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Base: ₱{item.product.price.toFixed(2)}
                    </span>
                    <span>•</span>
                    <span style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--primary)', fontWeight: '500' }}>
                      Breakdown: {item.breakdown}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shopping-item-right" style={{ gap: '1.25rem' }}>
                {/* Quantity Editor */}
                <div className="stock-adjuster">
                  <button
                    className="btn-adjust"
                    onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                    title="Decrease Quantity"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="stock-count-display"
                    value={item.quantity}
                    onChange={e => handleQtyChange(item.product.id, e.target.value)}
                    style={{ border: 'none', background: 'transparent', width: '3.5rem', fontWeight: 600, outline: 'none' }}
                  />
                  <button
                    className="btn-adjust"
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    title="Increase Quantity"
                  >
                    +
                  </button>
                </div>

                <div style={{ textAlign: 'right', minWidth: '5.5rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    ₱{item.total.toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-icon-danger"
                  onClick={() => onRemoveFromCart(item.product.id)}
                  title="Remove from Cart"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}

          {/* Grand Total POS Summary Card */}
          <div 
            style={{ 
              marginTop: '1.5rem', 
              padding: '1.25rem', 
              background: 'var(--bg-app)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* Custom Adjustment Inputs */}
            <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Custom Adjustment (Fee/Discount)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="search"
                  className="form-input"
                  placeholder="Adjustment Description (e.g. Ice surcharge, Round-off)"
                  value={adjustmentLabel}
                  onChange={e => setAdjustmentLabel(e.target.value)}
                  style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem 0.6rem', background: 'var(--bg-card)' }}
                />
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="₱0.00"
                  value={adjustmentAmount === 0 ? '' : adjustmentAmount}
                  onChange={e => setAdjustmentAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  style={{ width: '100px', fontSize: '0.85rem', padding: '0.4rem 0.6rem', background: 'var(--bg-card)', fontWeight: 'bold', color: adjustmentAmount < 0 ? 'var(--danger)' : adjustmentAmount > 0 ? 'var(--success)' : 'inherit' }}
                />
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Tip: Enter positive values for extra fees (surcharges), or negative values for custom discounts.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {adjustmentAmount !== 0 ? 'Adjusted Total' : 'Grand Total'}
              </span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₱{adjustedTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)' }}
            >
              💸 Complete Sale / Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
