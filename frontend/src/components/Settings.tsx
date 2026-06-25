import React, { useState } from 'react';
import type { Product } from '../types';
import { ConfirmationModal } from './ConfirmationModal';
import { AuditLogs } from './AuditLogs';
import { NO_CATEGORY_OPTION_LABEL, UNCATEGORIZED_CATEGORY, formatCategoryLabel } from '../categoryLabels';

interface SettingsProps {
  products: Product[];
  categories: string[];
  salesCount: number;
  onClearSales: () => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onEditProduct: (product: Product) => void;
  logs: any[];
  onViewNote?: (notes: string, name: string) => void;
  onRestoreSuccess: (data: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  products,
  categories,
  salesCount,
  onClearSales,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onDeleteProduct,
  onEditProduct,
  logs,
  onViewNote,
  onRestoreSuccess,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'manager' | 'logs'>(() => {
    const savedSubTab = localStorage.getItem('tindahan-active-subtab');
    return (savedSubTab as any) || 'manager';
  });
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);
  
  const [productSearch, setProductSearch] = useState('');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await onAddCategory(newCatName.trim());
      setNewCatName('');
      setSuccess('Category added successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (cat: string) => {
    setEditingCat(cat);
    setEditCatName(cat);
    setError(null);
    setSuccess(null);
  };

  const handleSaveEdit = async (oldName: string) => {
    if (!editCatName.trim() || oldName === editCatName.trim()) {
      setEditingCat(null);
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await onUpdateCategory(oldName, editCatName.trim());
      setEditingCat(null);
      setSuccess(`Category renamed from "${oldName}" to "${editCatName.trim()}"!`);
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCat = (name: string) => {
    setCategoryToDelete(name);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const name = categoryToDelete;
    setCategoryToDelete(null);
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await onDeleteCategory(name);
      setSuccess(`Category "${name}" deleted successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (salesCount === 0) return;
    setIsClearHistoryConfirmOpen(true);
  };

  const handleConfirmClearHistory = async () => {
    setIsClearHistoryConfirmOpen(false);
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await onClearSales();
      setSuccess('Sales history log has been cleared successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to clear sales history.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const prod = productToDelete;
    setProductToDelete(null);
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await onDeleteProduct(prod.id);
      setSuccess(`Product "${prod.name}" deleted successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shopping-list-container" style={{ maxWidth: activeSubTab === 'manager' ? '1280px' : '750px', margin: '0 auto', transition: 'max-width var(--transition-normal)' }}>
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
            style={{ color: 'var(--accent)', verticalAlign: 'middle' }}
          >
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Store Settings & Categories
        </h2>
      </div>

      {/* Settings Sub-Tab Navigation Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => { setActiveSubTab('manager'); localStorage.setItem('tindahan-active-subtab', 'manager'); setError(null); setSuccess(null); }}
          className={`tab-btn ${activeSubTab === 'manager' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', margin: 0 }}
        >
          🏪 Store Manager
        </button>
        <button
          type="button"
          onClick={() => { setActiveSubTab('logs'); localStorage.setItem('tindahan-active-subtab', 'logs'); setError(null); setSuccess(null); }}
          className={`tab-btn ${activeSubTab === 'logs' ? 'active' : ''}`}
          style={{ flex: 1, justifyContent: 'center', margin: 0 }}
        >
          📜 System Audit Logs
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div style={{ color: 'var(--success)', background: 'var(--success-light)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--success)', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 600 }}>
          ✓ {success}
        </div>
      )}

      {activeSubTab === 'manager' ? (
        <>
          <div className="settings-desktop-grid">
            {/* Categories Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', height: '100%', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
              <div className="settings-card-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>📦 Manage Product Categories</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Add, edit, or delete store categories. Changes instantly update all grouped products.
                </p>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleAddCat} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="search"
                  className="form-input"
                  placeholder="e.g. Canned Goods, Toiletries"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  disabled={loading}
                  style={{ flex: 1, background: 'var(--bg-app)' }}
                />
                <button type="submit" className="btn-primary" disabled={loading || !newCatName.trim()} style={{ whiteSpace: 'nowrap' }}>
                  Add
                </button>
              </form>

              {/* Category List */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flex: 1, maxHeight: '320px', overflowY: 'auto' }}>
                {categories.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No categories defined yet.</p>
                  </div>
                ) : (
                  categories.map(cat => (
                    <div
                      key={cat}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                      }}
                    >
                      {editingCat === cat ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, marginRight: '0.5rem' }}>
                          <input
                            type="search"
                            className="form-input"
                            value={editCatName}
                            onChange={e => setEditCatName(e.target.value)}
                            style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.9rem', background: 'var(--bg-app)' }}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => handleSaveEdit(cat)}
                            disabled={loading || !editCatName.trim()}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setEditingCat(null)}
                            disabled={loading}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat === UNCATEGORIZED_CATEGORY ? NO_CATEGORY_OPTION_LABEL : cat}</span>
                          {cat !== UNCATEGORIZED_CATEGORY && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                className="card-edit-btn"
                                onClick={() => handleStartEdit(cat)}
                                title="Rename Category"
                                style={{ width: '30px', height: '30px' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="card-edit-btn"
                                onClick={() => handleDeleteCat(cat)}
                                title="Delete Category"
                                style={{ width: '30px', height: '30px', color: 'var(--danger)' }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Product Manager Card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', height: '100%', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
              <div className="settings-card-header">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>⚡ Quick Product Manager</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Search, edit detail parameters, or delete products directly from settings.
                </p>
              </div>

              {/* Product Search Input */}
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                <input
                  type="search"
                  className="form-input"
                  placeholder="Search products to manage..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.25rem', background: 'var(--bg-app)' }}
                />
              </div>

              {/* Scrollable Product List */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flex: 1, maxHeight: '320px', overflowY: 'auto' }}>
                {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '2rem 1rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No products found matching your search.</p>
                  </div>
                ) : (
                  products
                    .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.category.toLowerCase().includes(productSearch.toLowerCase()))
                    .map(prod => (
                      <div key={prod.id} className="settings-product-row">
                        <div className="settings-product-info">
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prod.name}>
                            {prod.name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {formatCategoryLabel(prod.category)}
                            {prod.notes && (
                              <div className="product-note-badge-wrapper" style={{ position: 'relative', top: 'auto', right: 'auto', zIndex: 5, marginLeft: '0.5rem' }}>
                                <button
                                  type="button"
                                  className="product-note-badge"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onViewNote) onViewNote(prod.notes!, prod.name);
                                  }}
                                  style={{ padding: '0.1rem 0.35rem', fontSize: '0.65rem' }}
                                >
                                  <svg className="note-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z" />
                                    <path d="M15 3v6h6M16 13H8M16 17H8M10 9H8" />
                                  </svg>
                                  <span className="note-text">Note</span>
                                </button>
                              </div>
                            )}
                          </span>
                        </div>
                        
                        <div className="settings-product-actions">
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginRight: '0.25rem' }}>
                            ₱{prod.price.toFixed(2)}
                          </span>
                          
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {/* Edit button */}
                            <button
                              type="button"
                              className="card-edit-btn"
                              onClick={() => onEditProduct(prod)}
                              title="Edit Product Details"
                              style={{ width: '30px', height: '30px', color: 'var(--text-muted)' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              className="card-edit-btn"
                              onClick={() => setProductToDelete(prod)}
                              title="Quick Delete Product"
                              style={{ width: '30px', height: '30px', color: 'var(--danger)' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone Card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>⚠️ Danger Zone</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Destructive operations for your Tindahan data. These choices cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Clear Sales History Log</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Currently stored: {salesCount} sales receipts</p>
              </div>
              <button
                type="button"
                className="btn-danger"
                onClick={handleClearHistory}
                disabled={loading || salesCount === 0}
                style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
              >
                Clear History Log
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Audit Logs Panel Tab */
        <AuditLogs logs={logs} onRestoreSuccess={onRestoreSuccess} />
      )}

      <ConfirmationModal
        isOpen={categoryToDelete !== null}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${categoryToDelete}"?\nAll products in this category will be reassigned to "${formatCategoryLabel(UNCATEGORIZED_CATEGORY)}".`}
        confirmText="Delete Category"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setCategoryToDelete(null)}
      />

      <ConfirmationModal
        isOpen={isClearHistoryConfirmOpen}
        title="Clear Sales History"
        message="Are you sure you want to permanently clear the sales transaction history?\nThis cannot be undone and will reset your total earnings dashboard."
        confirmText="Clear History"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmClearHistory}
        onCancel={() => setIsClearHistoryConfirmOpen(false)}
      />

      <ConfirmationModal
        isOpen={productToDelete !== null}
        title="Delete Product"
        message={`Are you sure you want to permanently delete the product "${productToDelete?.name}"?\nThis action cannot be undone.`}
        confirmText="Delete Product"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
