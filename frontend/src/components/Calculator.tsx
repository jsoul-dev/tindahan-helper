import React, { useState, useEffect, useRef } from 'react';

interface CalculatorProps {
  onClose: () => void;
  style?: React.CSSProperties;
}

export const Calculator: React.FC<CalculatorProps> = ({ onClose, style }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [equationValue, setEquationValue] = useState('');
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('tindahan-calc-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync history to localStorage
  useEffect(() => {
    localStorage.setItem('tindahan-calc-history', JSON.stringify(history));
  }, [history]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target) && !target.closest('.calc-toggle-btn')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      // If typing in search input, ignore keyboard listeners
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
        return;
      }
      
      const key = e.key;
      if (/[0-9]/.test(key)) {
        handleKeyPress(key);
      } else if (['+', '-', '*', '/'].includes(key)) {
        handleKeyPress(key);
      } else if (key === '.' || key === ',') {
        handleKeyPress('.');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Escape') {
        onClose();
      } else if (key.toLowerCase() === 'c') {
        handleClear();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [equationValue, displayValue]);

  const handleKeyPress = (val: string) => {
    // Prevent consecutive double operators
    if (['+', '-', '*', '/'].includes(val)) {
      const lastChar = equationValue.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        setEquationValue(equationValue.slice(0, -1) + val);
        return;
      }
    }
    setEquationValue(prev => prev + val);
  };

  const handleClear = () => {
    setEquationValue('');
    setDisplayValue('');
  };

  const handleBackspace = () => {
    setEquationValue(prev => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    if (!equationValue.trim()) return;
    try {
      // Safe evaluation using Function
      // Replace safe characters only
      const sanitized = equationValue.replace(/[^0-9+\-*/().]/g, '');
      const result = new Function(`return (${sanitized})`)();
      if (result === undefined || isNaN(result) || !isFinite(result)) {
        setDisplayValue('Error');
        return;
      }
      const resultStr = Number(result.toFixed(4)).toString();
      setDisplayValue(resultStr);
      setHistory(prev => [
        `${equationValue} = ${resultStr}`,
        ...prev.slice(0, 19) // Keep last 20 entries
      ]);
      setEquationValue(resultStr);
    } catch (err) {
      setDisplayValue('Error');
    }
  };

  const handleHistoryClick = (item: string) => {
    const parts = item.split(' = ');
    if (parts.length > 0) {
      setEquationValue(parts[0]);
      setDisplayValue(parts[1] || '');
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div 
      ref={containerRef} 
      className="calculator-popover" 
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '0.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        width: '280px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        ...style
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          TINDAHAN CALCULATOR
        </span>
        <button 
          onClick={() => setShowHistory(!showHistory)} 
          className="btn-secondary"
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
          title="Show Calculation History"
        >
          {showHistory ? 'Calc' : 'History'}
        </button>
      </div>

      {showHistory ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '240px' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingRight: '0.25rem' }}>
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4rem' }}>
                No calculations logged yet.
              </p>
            ) : (
              history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleHistoryClick(item)}
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.5rem',
                    color: 'var(--text-main)',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={item}
                >
                  {item}
                </button>
              ))
            )}
          </div>
          {history.length > 0 && (
            <button 
              onClick={clearHistory} 
              className="btn-secondary" 
              style={{ marginTop: '0.5rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', width: '100%', justifyContent: 'center' }}
            >
              Clear History
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Display screen */}
          <div 
            style={{ 
              background: 'var(--bg-app)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-md)', 
              padding: '0.5rem 0.75rem', 
              textAlign: 'right',
              minHeight: '64px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {equationValue || '0'}
            </div>
            <div style={{ color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayValue || equationValue || '0'}
            </div>
          </div>

          {/* Grid keypad */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '0.4rem' 
            }}
          >
            <button type="button" onClick={handleClear} className="calc-btn danger" style={{ color: 'var(--danger)' }}>C</button>
            <button type="button" onClick={handleBackspace} className="calc-btn">⌫</button>
            <button type="button" onClick={() => handleKeyPress('/')} className="calc-btn operator">/</button>
            <button type="button" onClick={() => handleKeyPress('*')} className="calc-btn operator">×</button>

            <button type="button" onClick={() => handleKeyPress('7')} className="calc-btn">7</button>
            <button type="button" onClick={() => handleKeyPress('8')} className="calc-btn">8</button>
            <button type="button" onClick={() => handleKeyPress('9')} className="calc-btn">9</button>
            <button type="button" onClick={() => handleKeyPress('-')} className="calc-btn operator">-</button>

            <button type="button" onClick={() => handleKeyPress('4')} className="calc-btn">4</button>
            <button type="button" onClick={() => handleKeyPress('5')} className="calc-btn">5</button>
            <button type="button" onClick={() => handleKeyPress('6')} className="calc-btn">6</button>
            <button type="button" onClick={() => handleKeyPress('+')} className="calc-btn operator">+</button>

            <button type="button" onClick={() => handleKeyPress('1')} className="calc-btn">1</button>
            <button type="button" onClick={() => handleKeyPress('2')} className="calc-btn">2</button>
            <button type="button" onClick={() => handleKeyPress('3')} className="calc-btn">3</button>
            
            {/* Equal button span 2 rows */}
            <button 
              type="button" 
              onClick={handleCalculate} 
              className="calc-btn action" 
              style={{ 
                gridRow: 'span 2', 
                background: 'var(--primary)', 
                color: 'var(--text-inverse)',
                fontWeight: 700,
                fontSize: '1.35rem'
              }}
            >
              =
            </button>

            {/* Zero button span 2 cols */}
            <button type="button" onClick={() => handleKeyPress('0')} className="calc-btn" style={{ gridColumn: 'span 2' }}>0</button>
            <button type="button" onClick={() => handleKeyPress('.')} className="calc-btn">.</button>
          </div>
        </>
      )}
    </div>
  );
};
