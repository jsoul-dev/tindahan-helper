import React, { useState } from 'react';
import { restoreLogEntry } from '../api';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  entityType: string;
  entityData: any;
  restorable: boolean;
}

interface AuditLogsProps {
  logs: AuditLogEntry[];
  onRestoreSuccess: (data: { logs: AuditLogEntry[]; products: any[]; sales: any[]; categories: string[] }) => void;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs, onRestoreSuccess }) => {
  const [filterType, setFilterType] = useState<'all' | 'create' | 'delete' | 'price' | 'checkout'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRestore = async (id: string, details: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRestoringId(id);
    try {
      const data = await restoreLogEntry(id);
      onRestoreSuccess(data);
      setSuccessMessage(`Successfully restored: "${details}"`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to restore database state.');
    } finally {
      setRestoringId(null);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.startsWith('create_')) return { bg: 'var(--success-light)', color: 'var(--success)', border: 'var(--success)' };
    if (action.startsWith('delete_')) return { bg: 'var(--danger-light)', color: 'var(--danger)', border: 'var(--danger)' };
    if (action.startsWith('restore_')) return { bg: 'var(--success-light)', color: 'var(--success)', border: 'var(--success)' };
    if (action === 'update_price') return { bg: 'var(--warning-light)', color: 'var(--warning)', border: 'var(--warning)' };
    if (action === 'checkout') return { bg: 'var(--primary-light)', color: 'var(--primary)', border: 'var(--primary)' };
    return { bg: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)', border: 'var(--border)' };
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Filter logs based on selection and search query
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterType === 'all') return true;
    if (filterType === 'create') return log.action.startsWith('create_');
    if (filterType === 'delete') return log.action.startsWith('delete_');
    if (filterType === 'price') return log.action === 'update_price';
    if (filterType === 'checkout') return log.action === 'checkout';
    
    return true;
  });

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>📜 System Audit Trails & Restoration</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Track history of created and deleted products, categories, receipts, checkout transactions, and price updates. You can restore previous items or rollback price changes.
      </p>

      {errorMessage && (
        <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', marginBottom: '1rem', fontSize: '0.82rem', fontWeight: 600 }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={{ color: 'var(--success)', background: 'var(--success-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)', marginBottom: '1rem', fontSize: '0.82rem', fontWeight: 600 }}>
          ✓ {successMessage}
        </div>
      )}

      {/* Filters and Search Bar Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
          <input
            type="search"
            className="form-input"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.25rem', background: 'var(--bg-app)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {(['all', 'create', 'delete', 'price', 'checkout'] as const).map(type => (
            <button
              key={type}
              type="button"
              className="btn-secondary"
              onClick={() => setFilterType(type)}
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-sm)',
                background: filterType === type ? 'var(--primary-light)' : 'transparent',
                color: filterType === type ? 'var(--primary)' : 'var(--text-muted)',
                borderColor: filterType === type ? 'var(--primary)' : 'var(--border)'
              }}
            >
              {type === 'all' ? 'All Logs' : type === 'create' ? 'Creations' : type === 'delete' ? 'Deletions' : type === 'price' ? 'Price Updates' : 'Sales'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table Wrapper */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '420px', overflowY: 'auto' }}>
        {filteredLogs.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No logs match your filters.
          </p>
        ) : (
          filteredLogs.map(log => {
            const badge = getActionBadgeColor(log.action);
            return (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Action badge */}
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.color}22`
                      }}
                    >
                      {formatActionName(log.action)}
                    </span>
                    {/* Timestamp */}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {/* Log details */}
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                    {log.details}
                  </span>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {log.restorable ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleRestore(log.id, log.details)}
                      disabled={restoringId !== null}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {restoringId === log.id ? 'Restoring...' : '↩ Restore'}
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingRight: '0.5rem' }}>
                      Permanent
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
