import React, { useState } from 'react';
import type { SaleRecord } from '../types';
import { ConfirmationModal } from './ConfirmationModal';

interface SalesHistoryProps {
  sales: SaleRecord[];
  onClearHistory: () => Promise<void>;
  onDeleteSale: (id: string) => Promise<void>;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ 
  sales, 
  onClearHistory, 
  onDeleteSale 
}) => {
  // Filtering and Sorting States
  const [searchId, setSearchId] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  const totalEarnings = sales.reduce((sum, sale) => sum + sale.total, 0);

  // Group sales by day for analytics (unfiltered, representing overall performance)
  const dailyMap: Record<string, { label: string; total: number; timestamp: number }> = {};
  const todayStr = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  let todayTotal = 0;
  let yesterdayTotal = 0;

  sales.forEach(sale => {
    const saleDate = new Date(sale.timestamp);
    const saleDateStr = saleDate.toDateString();
    
    if (saleDateStr === todayStr) {
      todayTotal += sale.total;
    } else if (saleDateStr === yesterdayStr) {
      yesterdayTotal += sale.total;
    }

    const year = saleDate.getFullYear();
    const month = String(saleDate.getMonth() + 1).padStart(2, '0');
    const day = String(saleDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    
    const label = saleDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        label,
        total: 0,
        timestamp: saleDate.getTime()
      };
    }
    dailyMap[dateKey].total += sale.total;
  });

  const dailyEarnings = Object.entries(dailyMap)
    .map(([key, data]) => ({
      dateKey: key,
      dateLabel: data.label,
      total: data.total,
      timestamp: data.timestamp
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  const maxDailyTotal = Math.max(...dailyEarnings.map(d => d.total), 1);

  // Filter Sales list by Receipt ID
  const filteredSales = sales.filter(sale => {
    if (!searchId.trim()) return true;
    const cleanId = sale.id.split('_')[1]?.split('-')[0] || sale.id.split('-')[0] || sale.id;
    return sale.id.toLowerCase().includes(searchId.toLowerCase()) || 
           cleanId.toLowerCase().includes(searchId.toLowerCase());
  });

  // Sort Sales list
  const sortedSales = [...filteredSales].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else if (sortBy === 'date-asc') {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else if (sortBy === 'total-desc') {
      return b.total - a.total;
    } else if (sortBy === 'total-asc') {
      return a.total - b.total;
    }
    return 0;
  });

  const handleClearHistory = () => {
    if (sales.length === 0) return;
    setIsClearConfirmOpen(true);
  };

  const handleConfirmClearHistory = async () => {
    setIsClearConfirmOpen(false);
    try {
      await onClearHistory();
    } catch (err: any) {
      console.error("Failed to clear sales history: " + err.message);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setSaleToDelete(id);
  };

  const handleConfirmDeleteSale = async () => {
    if (!saleToDelete) return;
    const id = saleToDelete;
    setSaleToDelete(null);
    try {
      await onDeleteSale(id);
    } catch (err: any) {
      console.error("Failed to delete sale record: " + err.message);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="shopping-list-container">
      {/* Tab Header */}
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
            <path d="M12 20h9M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M12 4v6M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M8 14h8M8 17h8" />
          </svg>
          Sales & Earnings Reports
        </h2>
        {sales.length > 0 && (
          <button 
            className="btn-secondary" 
            onClick={handleClearHistory}
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', fontSize: '0.8rem' }}
          >
            Clear History Log
          </button>
        )}
      </div>

      {sales.length > 0 ? (
        <>
          {/* Quick Analytics Stats Widgets */}
          <div className="sales-analytics-grid">
            <div className="sales-analytic-card">
              <span className="sales-analytic-label">Today's Sales</span>
              <h3 className="sales-analytic-value" style={{ color: 'var(--primary)' }}>₱{todayTotal.toFixed(2)}</h3>
            </div>
            
            <div className="sales-analytic-card">
              <span className="sales-analytic-label">Yesterday's Sales</span>
              <h3 className="sales-analytic-value" style={{ color: 'var(--accent)' }}>₱{yesterdayTotal.toFixed(2)}</h3>
            </div>

            <div className="sales-analytic-card all-time-card">
              <span className="sales-analytic-label">All-Time Total</span>
              <h3 className="sales-analytic-value" style={{ color: 'var(--success)' }}>₱{totalEarnings.toFixed(2)}</h3>
            </div>
          </div>

          {/* Historical Trend Chart Panel */}
          <div 
            style={{ 
              background: 'var(--bg-app)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-md)', 
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}
          >
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📊 Daily Collections Trend
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dailyEarnings.slice(0, 7).map(day => {
                const percentage = (day.total / maxDailyTotal) * 100;
                const isToday = new Date(day.timestamp).toDateString() === todayStr;
                const isYesterday = new Date(day.timestamp).toDateString() === yesterdayStr;
                
                let labelSuffix = '';
                if (isToday) labelSuffix = ' (Today)';
                else if (isYesterday) labelSuffix = ' (Yesterday)';

                return (
                  <div key={day.dateKey} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                      <span>{day.dateLabel}{labelSuffix}</span>
                      <span style={{ color: 'var(--primary)' }}>₱{day.total.toFixed(2)}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--border)', borderRadius: '50px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${percentage}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, var(--primary), var(--accent))', 
                          borderRadius: '50px',
                          transition: 'width 0.5s ease-out'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search and Sort Filter Bar for Receipts */}
          <div className="search-actions-bar" style={{ marginBottom: '1.5rem', background: 'var(--bg-app)' }}>
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="search"
                className="search-input"
                placeholder="Search by Receipt ID (e.g. sale_1)..."
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                style={{ background: 'var(--bg-card)' }}
              />
            </div>
            <div className="filter-wrapper">
              <select
                className="select-filter"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                style={{ background: 'var(--bg-card)' }}
              >
                <option value="date-desc">Date: Newest First</option>
                <option value="date-asc">Date: Oldest First</option>
                <option value="total-desc">Total Paid: Highest First</option>
                <option value="total-asc">Total Paid: Lowest First</option>
              </select>
            </div>
          </div>

          {/* Individual Receipts Log List */}
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            📋 Completed Sales Receipts ({sortedSales.length})
          </h3>
          
          {sortedSales.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.9rem' }}>
              No receipts match your search filter.
            </p>
          ) : (
            <div className="receipts-grid">
              {sortedSales.map(sale => (
                <div 
                  key={sale.id} 
                  className="shopping-item-row" 
                  style={{ 
                    flexDirection: 'column', 
                    alignItems: 'stretch', 
                    background: 'var(--bg-card)', 
                    gap: '0.5rem',
                    position: 'relative',
                    height: '100%',
                    justifyContent: 'space-between'
                  }}
                >
                  {/* Receipt Header */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      borderBottom: '1px solid var(--border)', 
                      paddingBottom: '0.5rem',
                      gap: '1rem'
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      ID: {sale.id.split('_')[1]?.split('-')[0] || sale.id.split('-')[0]}
                    </span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        ⏰ {formatDate(sale.timestamp)}
                      </span>
                      
                      {/* Delete Specific Record Button */}
                      <button
                        className="card-edit-btn"
                        onClick={() => handleDeleteRecord(sale.id)}
                        title="Delete this transaction"
                        style={{ 
                          width: '28px', 
                          height: '28px', 
                          borderRadius: '6px', 
                          border: 'none', 
                          color: 'var(--danger)', 
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Receipt Items Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.25rem 0', flexGrow: 1 }}>
                    {sale.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span>
                          <strong>{item.quantity}x</strong> {item.name}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          ₱{item.pricePaid.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Receipt Total Footer */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Total Paid</span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                      ₱{sale.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
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
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="4" />
              <line x1="8" x2="8" y1="2" y2="4" />
              <line x1="3" x2="21" y1="10" y2="10" />
              <path d="M8 14h8M8 18h5" />
            </svg>
          </div>
          <h3>No Completed Transactions</h3>
          <p style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
            Complete checkouts in the "Checkout Cart" tab. Once completed, receipts and payment records will be saved here.
          </p>
        </div>
      )}
      
      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        title="Clear Sales History"
        message="Are you sure you want to permanently clear the sales transaction history?\nThis cannot be undone and will reset your total earnings dashboard."
        confirmText="Clear History"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmClearHistory}
        onCancel={() => setIsClearConfirmOpen(false)}
      />

      <ConfirmationModal
        isOpen={saleToDelete !== null}
        title="Delete Sale Record"
        message="Are you sure you want to delete this specific transaction record?\nThis will permanently adjust your total earnings."
        confirmText="Delete Record"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDeleteSale}
        onCancel={() => setSaleToDelete(null)}
      />
    </div>
  );
};
