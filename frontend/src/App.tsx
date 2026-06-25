import { useState, useEffect } from 'react';
import type { Product, ServerInfo, SaleRecord, SaleRecordItem } from './types';
import { 
  fetchProducts, 
  fetchServerInfo, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  fetchSales, 
  recordSale, 
  clearSalesHistory, 
  deleteSale,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchAuditLogs
} from './api';
import { ProductCard } from './components/ProductCard';
import { ProductForm } from './components/ProductForm';
import { CartPOS, calculateItemTotal } from './components/CartPOS';
import { SalesHistory } from './components/SalesHistory';
import { MobileShareGuide } from './components/MobileShareGuide';
import { Settings } from './components/Settings';
import { Calculator } from './components/Calculator';
import { NO_CATEGORY_OPTION_LABEL, UNCATEGORIZED_CATEGORY } from './categoryLabels';


const COLOR_THEMES = [
  {
    name: 'Amethyst Lavender',
    variables: {
      '--bg-app': '#221528',
      '--bg-card': '#2d1c33',
      '--border': '#452b4f',
      '--text-main': '#f3e8ff',
      '--text-muted': '#b9a2c8',
      '--text-inverse': '#221528',
      '--primary': '#c084fc',
      '--primary-hover': '#a855f7',
      '--primary-light': 'rgba(192, 132, 252, 0.1)',
      '--accent': '#e879f9',
      '--accent-light': 'rgba(232, 121, 249, 0.1)',
      '--success': '#34d399',
      '--success-light': 'rgba(52, 211, 153, 0.1)',
      '--warning': '#fbbf24',
      '--warning-light': 'rgba(251, 191, 36, 0.1)',
      '--danger': '#f87171',
      '--danger-light': 'rgba(248, 113, 113, 0.1)',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      '--shadow-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
    }
  },
  {
    name: 'Emerald Moss',
    variables: {
      '--bg-app': '#14201a',
      '--bg-card': '#1b2b23',
      '--border': '#2c4538',
      '--text-main': '#ecfdf5',
      '--text-muted': '#98bfae',
      '--text-inverse': '#14201a',
      '--primary': '#34d399',
      '--primary-hover': '#10b981',
      '--primary-light': 'rgba(52, 211, 153, 0.1)',
      '--accent': '#fbbf24',
      '--accent-light': 'rgba(251, 191, 36, 0.1)',
      '--success': '#059669',
      '--success-light': 'rgba(5, 150, 105, 0.1)',
      '--warning': '#d97706',
      '--warning-light': 'rgba(217, 119, 6, 0.1)',
      '--danger': '#dc2626',
      '--danger-light': 'rgba(220, 38, 38, 0.1)',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
      '--shadow-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
    }
  },
  {
    name: 'Warm Cocoa',
    variables: {
      '--bg-app': '#231815',
      '--bg-card': '#2d201c',
      '--border': '#47322c',
      '--text-main': '#fff7ed',
      '--text-muted': '#c4aba2',
      '--text-inverse': '#231815',
      '--primary': '#f97316',
      '--primary-hover': '#ea580c',
      '--primary-light': 'rgba(249, 115, 22, 0.1)',
      '--accent': '#facc15',
      '--accent-light': 'rgba(250, 204, 21, 0.1)',
      '--success': '#34d399',
      '--success-light': 'rgba(52, 211, 153, 0.1)',
      '--warning': '#f59e0b',
      '--warning-light': 'rgba(245, 158, 11, 0.1)',
      '--danger': '#ef4444',
      '--danger-light': 'rgba(239, 68, 68, 0.1)',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      '--shadow-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
    }
  },
  {
    name: 'Crimson Velvet',
    variables: {
      '--bg-app': '#241416',
      '--bg-card': '#301b1e',
      '--border': '#4d2a2f',
      '--text-main': '#fff5f5',
      '--text-muted': '#cfa2a6',
      '--text-inverse': '#241416',
      '--primary': '#f43f5e',
      '--primary-hover': '#e11d48',
      '--primary-light': 'rgba(244, 63, 94, 0.1)',
      '--accent': '#fb7185',
      '--accent-light': 'rgba(251, 113, 133, 0.1)',
      '--success': '#10b981',
      '--success-light': 'rgba(16, 185, 129, 0.1)',
      '--warning': '#f59e0b',
      '--warning-light': 'rgba(245, 158, 11, 0.1)',
      '--danger': '#dc2626',
      '--danger-light': 'rgba(220, 38, 38, 0.1)',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
      '--shadow-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
    }
  },
  {
    name: 'Copper Rust',
    variables: {
      '--bg-app': '#281b1b',
      '--bg-card': '#362424',
      '--border': '#4e3434',
      '--text-main': '#fef2f2',
      '--text-muted': '#fca5a5',
      '--text-inverse': '#281b1b',
      '--primary': '#f87171',
      '--primary-hover': '#ef4444',
      '--primary-light': 'rgba(248, 113, 113, 0.1)',
      '--accent': '#fb923c',
      '--accent-light': 'rgba(251, 146, 60, 0.1)',
      '--success': '#10b981',
      '--success-light': 'rgba(16, 185, 129, 0.1)',
      '--warning': '#f59e0b',
      '--warning-light': 'rgba(245, 158, 11, 0.1)',
      '--danger': '#ef4444',
      '--danger-light': 'rgba(239, 68, 68, 0.1)',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
      '--shadow-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
    }
  },
  {
    name: 'Midnight Amber',
    variables: {
      '--bg-app': '#1c1b19',
      '--bg-card': '#272522',
      '--border': '#3d3b37',
      '--text-main': '#fbf1c7',
      '--text-muted': '#a89984',
      '--text-inverse': '#1c1b19',
      '--primary': '#fabd2f',
      '--primary-hover': '#d79921',
      '--primary-light': 'rgba(250, 189, 47, 0.1)',
      '--accent': '#fe8019',
      '--accent-light': 'rgba(254, 128, 25, 0.1)',
      '--success': '#b8bb26',
      '--success-light': 'rgba(184, 187, 38, 0.1)',
      '--warning': '#d65d0e',
      '--warning-light': 'rgba(214, 93, 14, 0.1)',
      '--danger': '#fb4934',
      '--danger-light': 'rgba(251, 73, 52, 0.1)',
      '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
      '--shadow-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
    }
  }
];

const BACKGROUND_PATTERNS = [
  {
    name: 'Spades Grid',
    value: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M15 8c-1.5 0-5 5-5 8 0 3.5 2.5 4.5 5 4.5s5-1 5-4.5c0-3-3.5-8-5-8zm0 12.5v3.5h-2v1h4v-1h-2v-3.5zM45 38c-1.5 0-5 5-5 8 0 3.5 2.5 4.5 5 4.5s5-1 5-4.5c0-3-3.5-8-5-8zm0 12.5v3.5h-2v1h4v-1h-2v-3.5z' fill='%23ffffff' fill-opacity='0.035'/%3E%3C/svg%3E")`
  },
  {
    name: 'Shopping Bags',
    value: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M11 12v-1a4 4 0 0 1 8 0v1h2a1 1 0 0 1 1 1v7a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-7a1 1 0 0 1 1-1h2zm2 0h4v-1a2 2 0 0 0-4 0v1zM41 42v-1a4 4 0 0 1 8 0v1h2a1 1 0 0 1 1 1v7a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-7a1 1 0 0 1 1-1h2zm2 0h4v-1a2 2 0 0 0-4 0v1z' fill='%23ffffff' fill-opacity='0.035'/%3E%3C/svg%3E")`
  },
  {
    name: 'Tindahan Shields',
    value: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg transform='translate%2810,10%29' fill='none' stroke='%23ffffff' stroke-opacity='0.035' stroke-width='2'%3E%3Cpath d='M20 2C12 2 8 5 8 11c0 6 6 10 12 13 6-3 12-7 12-13 0-6-4-9-12-9z'/%3E%3Ctext x='20' y='14' font-family='sans-serif' font-size='9' font-weight='bold' fill='%23ffffff' fill-opacity='0.035' stroke='none' text-anchor='middle' dominant-baseline='middle'%3ETH%3C/text%3E%3C/g%3E%3Cg transform='translate%2850,50%29' fill='none' stroke='%23ffffff' stroke-opacity='0.035' stroke-width='2'%3E%3Cpath d='M20 2C12 2 8 5 8 11c0 6 6 10 12 13 6-3 12-7 12-13 0-6-4-9-12-9z'/%3E%3Ctext x='20' y='14' font-family='sans-serif' font-size='9' font-weight='bold' fill='%23ffffff' fill-opacity='0.035' stroke='none' text-anchor='middle' dominant-baseline='middle'%3ETH%3C/text%3E%3C/g%3E%3C/svg%3E")`
  },
  {
    name: 'Peso Coins',
    value: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg transform='translate%2810,10%29' fill='none' stroke='%23ffffff' stroke-opacity='0.035' stroke-width='1.5'%3E%3Ccircle cx='10' cy='10' r='8'/%3E%3Cpath d='M7 6h6M7 8h6M9 6v6c0 1.5 1 2 2 2' stroke-width='1.2'/%3E%3C/g%3E%3Cg transform='translate%2840,40%29' fill='none' stroke='%23ffffff' stroke-opacity='0.035' stroke-width='1.5'%3E%3Ccircle cx='10' cy='10' r='8'/%3E%3Cpath d='M7 6h6M7 8h6M9 6v6c0 1.5 1 2 2 2' stroke-width='1.2'/%3E%3C/g%3E%3C/svg%3E")`
  },
  {
    name: 'Sparkle Stars',
    value: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='65' height='65' viewBox='0 0 65 65'%3E%3Cpath d='M32.5 5 L36.5 24 L55 28 L36.5 32 L32.5 51 L28.5 32 L10 28 L28.5 24 Z' fill='%23ffffff' fill-opacity='0.035'/%3E%3Cpath d='M0 32.5 L2 45 L15 47 L2 49 L0 61.5 L-2 49 L-15 47 L-2 45 Z' fill='%23ffffff' fill-opacity='0.035'/%3E%3Cpath d='M65 32.5 L67 45 L80 47 L67 49 L65 61.5 L63 49 L50 47 L63 45 Z' fill='%23ffffff' fill-opacity='0.035'/%3E%3C/svg%3E")`
  }
];

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentThemeName, setCurrentThemeName] = useState('');
  const [currentPatternName, setCurrentPatternName] = useState('');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [statsExpanded, setStatsExpanded] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const applyThemeAndPattern = (themeObj: typeof COLOR_THEMES[0], patternObj: typeof BACKGROUND_PATTERNS[0]) => {
    Object.entries(themeObj.variables).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
    document.documentElement.style.setProperty('--bg-pattern-image', patternObj.value);
    
    setCurrentThemeName(themeObj.name);
    setCurrentPatternName(patternObj.name);
  };

  // Synchronize: Color theme persists, pattern randomizes on refresh
  useEffect(() => {
    const savedThemeName = localStorage.getItem('tindahan-theme');
    let initialTheme = COLOR_THEMES.find(t => t.name === savedThemeName);
    if (!initialTheme) {
      initialTheme = COLOR_THEMES.find(t => t.name === 'Midnight Amber') || COLOR_THEMES[0];
      localStorage.setItem('tindahan-theme', initialTheme.name);
    }
    
    const randomPattern = BACKGROUND_PATTERNS[Math.floor(Math.random() * BACKGROUND_PATTERNS.length)];
    applyThemeAndPattern(initialTheme, randomPattern);
  }, []);

  const selectTheme = (themeName: string) => {
    const themeObj = COLOR_THEMES.find(t => t.name === themeName);
    if (!themeObj) return;
    localStorage.setItem('tindahan-theme', themeObj.name);
    const currentPattern = BACKGROUND_PATTERNS.find(p => p.name === currentPatternName) || BACKGROUND_PATTERNS[0];
    applyThemeAndPattern(themeObj, currentPattern);
    setShowThemePicker(false);
  };

  useEffect(() => {
    if (!showThemePicker) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.theme-picker-popover') && !target.closest('.theme-picker-toggle-btn')) {
        setShowThemePicker(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showThemePicker]);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<string[]>([]);
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<'inventory' | 'cart' | 'history' | 'guide' | 'settings'>(() => {
    const savedTab = sessionStorage.getItem('tindahan-active-tab');
    return (savedTab as any) || 'inventory';
  });

  const handleSetActiveTab = async (tab: 'inventory' | 'cart' | 'history' | 'guide' | 'settings') => {
    setActiveTab(tab);
    sessionStorage.setItem('tindahan-active-tab', tab);
    if (tab === 'settings') {
      try {
        const auditLogs = await fetchAuditLogs();
        setLogs(auditLogs);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Modals & Lightbox
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ path: string; name: string; location: string } | null>(null);
  const [viewingNote, setViewingNote] = useState<{ name: string; notes: string } | null>(null);

  // Status indicators
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
        
        const info = await fetchServerInfo();
        setServerInfo(info);

        const salesLog = await fetchSales();
        setSales(salesLog);

        const cats = await fetchCategories();
        setCategories(cats);
        
        if (activeTab === 'settings') {
          try {
            const auditLogs = await fetchAuditLogs();
            setLogs(auditLogs);
          } catch (err) {
            console.error('Failed to fetch audit logs:', err);
          }
        }
        
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError('Could not connect to the database server. Ensure your backend server is running.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddCategory = async (name: string) => {
    try {
      const updatedCats = await createCategory(name);
      setCategories(updatedCats);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to add category.');
    }
  };

  const handleUpdateCategory = async (oldName: string, newName: string) => {
    try {
      const data = await updateCategory(oldName, newName);
      setCategories(data.categories);
      setProducts(data.products);
      if (selectedCategory === oldName) {
        setSelectedCategory(newName);
      }
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to rename category.');
    }
  };

  const handleDeleteCategory = async (name: string) => {
    try {
      const data = await deleteCategory(name);
      setCategories(data.categories);
      setProducts(data.products);
      if (selectedCategory === name) {
        setSelectedCategory('All');
      }
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to delete category.');
    }
  };

  // Save (Create or Update) handler
  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'updatedAt'> & { id?: string }) => {
    try {
      if (productData.id) {
        // Edit mode
        const updated = await updateProduct(productData.id, productData);
        setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      } else {
        // Add mode
        const created = await createProduct(productData);
        setProducts(prev => [created, ...prev]);
      }
      // Refresh categories list
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to save product details to server.');
    }
  };

  // Delete handler
  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      // Remove from cart if deleted
      if (cart[id]) {
        const updatedCart = { ...cart };
        delete updatedCart[id];
        setCart(updatedCart);
      }
      // Refresh categories list
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to delete product.');
    }
  };

  // Cart Operations
  const handleAddToCart = (product: Product) => {
    setCart(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleUpdateCartQuantity = (id: string, qty: number) => {
    setCart(prev => ({
      ...prev,
      [id]: qty,
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    const updatedCart = { ...cart };
    delete updatedCart[id];
    setCart(updatedCart);
  };

  const handleClearCart = () => {
    setCart({});
  };

  const handleCheckout = async (items: SaleRecordItem[], total: number) => {
    try {
      const savedRecord = await recordSale(items, total);
      setSales(prev => [savedRecord, ...prev]);
      setCart({});
      handleSetActiveTab('history'); // Switch to history tab to view checkout details
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to complete checkout.');
    }
  };

  const handleClearSales = async () => {
    try {
      await clearSalesHistory();
      setSales([]);
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to clear sales history.');
    }
  };

  const handleDeleteSale = async (id: string) => {
    try {
      await deleteSale(id);
      setSales(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || 'Failed to delete sale record.');
    }
  };

  // Derived Stats
  const totalProducts = products.length;
  
  // Total Sales Earnings
  const totalSalesValue = sales.reduce((acc, curr) => acc + curr.total, 0);
  
  // Cart Subtotal Calculation (incorporating bulk discount rules)
  const cartItemsCount = Object.values(cart).reduce((sum, val) => sum + val, 0);
  const cartSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find(p => p.id === id);
    if (!product) return sum;
    const { total } = calculateItemTotal(product.price, qty, product.specialPrices);
    return sum + total;
  }, 0);

  // Filtered product listing
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category || UNCATEGORIZED_CATEGORY).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      selectedCategory === 'All' || 
      (selectedCategory === UNCATEGORIZED_CATEGORY && (!product.category || product.category === UNCATEGORIZED_CATEGORY)) ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Pagination Calculations
  const itemsPerPage = isMobile ? 10 : 20;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const activePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  const cartUniqueCount = Object.keys(cart).length;

  return (
    <>
      {/* Navigation & Branding Header */}
      <header className="app-header">
        <div className="header-content">
          <button
            type="button"
            className="logo-section"
            onClick={() => handleSetActiveTab('inventory')}
            aria-label="Go to Shelves & Prices"
            title="Go to Shelves & Prices"
          >
            <div className="logo-icon" style={{ padding: '4px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%', display: 'block' }}>
                {/* Roof Awning */}
                <path d="M2 9h20L19 3H5L2 9z" fill="rgba(255,255,255,0.1)" />
                {/* Awning stripes details */}
                <path d="M6 3v6M10 3v6M14 3v6M18 3v6" />
                {/* Storefront walls */}
                <path d="M4 9v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
                {/* Entrance Door / Window counter */}
                <path d="M9 22V13h6v9" />
                {/* Open sign / Shelf item */}
                <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div className="logo-title">
              <h1>Tindahan Helper</h1>
              <p>Sari-Sari Store Price Lookup</p>
            </div>
          </button>

          <div className="header-actions">
            <nav className="tabs-nav">
              <button
                className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => handleSetActiveTab('inventory')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect width="7" height="9" x="3" y="3" rx="1"/>
                  <rect width="7" height="5" x="14" y="3" rx="1"/>
                  <rect width="7" height="9" x="14" y="12" rx="1"/>
                  <rect width="7" height="5" x="3" y="16" rx="1"/>
                </svg>
                Shelves & Prices
              </button>
              <button
                className={`tab-btn ${activeTab === 'cart' ? 'active' : ''}`}
                onClick={() => handleSetActiveTab('cart')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="8" cy="21" r="1"/>
                  <circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
                Checkout Cart
                {cartUniqueCount > 0 && (
                  <span style={{ marginLeft: '0.35rem', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '0.05rem 0.35rem', borderRadius: '50px', fontWeight: 'bold' }}>
                    {cartUniqueCount}
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => handleSetActiveTab('history')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                  <line x1="16" x2="16" y1="2" y2="4"/>
                  <line x1="8" x2="8" y1="2" y2="4"/>
                  <line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
                Sales History
              </button>
              <button
                className={`tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
                onClick={() => handleSetActiveTab('guide')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                  <path d="M12 18h.01"/>
                </svg>
                Mobile Connect
              </button>
            </nav>

            {/* Calculator Button */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCalculator(!showCalculator);
                  setShowThemePicker(false);
                }}
                className="card-edit-btn calc-toggle-btn"
                title="Open Tindahan Calculator"
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: 'var(--radius-md)', 
                  flexShrink: 0,
                  background: showCalculator ? 'var(--primary-light)' : 'transparent',
                  color: showCalculator ? 'var(--primary)' : 'var(--text-muted)',
                  borderColor: showCalculator ? 'var(--primary)' : 'var(--border)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                  <line x1="9" y1="22" x2="9" y2="16" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="16" y1="22" x2="16" y2="16" />
                  <line x1="4" y1="16" x2="20" y2="16" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="22" />
                  <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
                  <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
                  <circle cx="16" cy="10" r="1" fill="currentColor" stroke="none" />
                </svg>
              </button>

              {showCalculator && (
                <Calculator onClose={() => setShowCalculator(false)} />
              )}
            </div>

            {/* Theme Picker Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => {
                  setShowThemePicker(!showThemePicker);
                  setShowCalculator(false);
                }}
                className="card-edit-btn theme-picker-toggle-btn"
                title={`Change Theme Color (Current Theme: ${currentThemeName})`}
                style={{ 
                  width: '38px', 
                  height: '38px', 
                  borderRadius: 'var(--radius-md)', 
                  flexShrink: 0,
                  background: showThemePicker ? 'var(--primary-light)' : 'transparent',
                  color: showThemePicker ? 'var(--primary)' : 'var(--text-muted)',
                  borderColor: showThemePicker ? 'var(--primary)' : 'var(--border)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z" opacity="0.75" fill="currentColor" stroke="none"/>
                  <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" opacity="0.75" fill="currentColor" stroke="none"/>
                </svg>
              </button>

              {showThemePicker && (
                <div 
                  className="theme-picker-popover" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.5rem',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    minWidth: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem'
                  }}
                >
                  <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                    SELECT COLOR THEME
                  </div>
                  {COLOR_THEMES.map(theme => {
                    const isActive = theme.name === currentThemeName;
                    const primaryColor = theme.variables['--primary'];
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => selectTheme(theme.name)}
                        className={`theme-picker-item ${isActive ? 'active' : ''}`}
                        style={{ color: isActive ? 'var(--primary)' : 'var(--text-main)' }}
                      >
                        <span 
                          style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            background: primaryColor,
                            boxShadow: '0 0 2px rgba(0,0,0,0.3)',
                            flexShrink: 0
                          }} 
                        />
                        <span style={{ flex: 1 }}>{theme.name}</span>
                        {isActive && <span style={{ fontSize: '0.75rem' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Standalone Settings Button */}
            <button
              type="button"
              onClick={() => handleSetActiveTab(activeTab === 'settings' ? 'inventory' : 'settings')}
              className="card-edit-btn header-settings-btn"
              title="Store Settings & Categories"
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: 'var(--radius-md)', 
                flexShrink: 0,
                background: activeTab === 'settings' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)',
                borderColor: activeTab === 'settings' ? 'var(--primary)' : 'var(--border)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="app-container">
        {error && (
          <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)', marginBottom: '1.5rem', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Inventory Stats Widget Dashboard */}
        <section className="stats-grid">
          {/* Card 1: Total Varieties (Toggle Card on Mobile) */}
          <div 
            className={`stat-card ${isMobile ? 'interactive' : ''}`}
            onClick={isMobile ? () => setStatsExpanded(!statsExpanded) : undefined}
            style={{ cursor: isMobile ? 'pointer' : 'default' }}
          >
            <div className="stat-icon" style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-main)' }}>
              📦
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Varieties</span>
              <span className="stat-value">{totalProducts}</span>
            </div>
            {isMobile && (
              <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                  style={{ 
                    transform: statsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform var(--transition-normal)'
                  }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            )}
          </div>

          {/* Cards 2, 3, 4 nested in mobile collapsible wrapper */}
          <div className={`mobile-collapsible-stats ${statsExpanded ? 'expanded' : 'collapsed'}`}>
            {/* Card 2: Active Cart Items */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                🛒
              </div>
              <div className="stat-info">
                <span className="stat-label">Active Cart Items</span>
                <span className="stat-value">{cartItemsCount}</span>
              </div>
            </div>

            {/* Card 3: Cart Subtotal */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                💳
              </div>
              <div className="stat-info">
                <span className="stat-label">Cart Subtotal</span>
                <span className="stat-value">₱{cartSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Card 4: Total Earnings */}
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                ₱
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Earnings</span>
                <span className="stat-value">₱{totalSalesValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Syncing with Tindahan database...</span>
          </div>
        ) : (
          <>
            {/* VIEW 1: PRODUCTS INVENTORY GRID */}
            {activeTab === 'inventory' && (
              <>
                {/* Search & Filtering Controls */}
                <section className="search-actions-bar">
                  <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="search"
                      className="search-input"
                      placeholder="Search product name, category, or location..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="filter-wrapper">
                    {/* Category Dropdown */}
                    <select
                      className="select-filter"
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      {categories.filter(cat => cat !== UNCATEGORIZED_CATEGORY).map((cat, idx) => (
                        <option key={idx} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value={UNCATEGORIZED_CATEGORY}>{NO_CATEGORY_OPTION_LABEL}</option>
                    </select>
                  </div>

                  <button
                    className="btn-primary btn-desktop-add"
                    onClick={() => setIsAddingProduct(true)}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>+</span> Add Product
                  </button>
                </section>

                {/* Product Grid View */}
                {filteredProducts.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {products.length === 0 ? (
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                          <path d="m3.3 7 8.7 5 8.7-5" />
                          <path d="M12 22V12" />
                        </svg>
                      ) : (
                        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                          <path d="m9 8 6 6" />
                          <path d="m15 8-6 6" />
                        </svg>
                      )}
                    </div>
                    <h3>{products.length === 0 ? 'Your inventory is empty' : 'No products match your filters'}</h3>
                    <p style={{ maxWidth: '400px', fontSize: '0.9rem' }}>
                      {products.length === 0
                        ? 'Get started by adding your first product to the store.'
                        : 'Try adjusting your search keywords or category selectors to locate your products.'}
                    </p>
                    {products.length === 0 ? (
                      <button className="btn-primary" onClick={() => setIsAddingProduct(true)}>
                        + Add Product
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="products-grid">
                      {paginatedProducts.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onEdit={setEditingProduct}
                          onAddToCart={handleAddToCart}
                          onViewImage={(path, name, location) => setViewingImage({ path, name, location })}
                          onViewNote={(notes, name) => setViewingNote({ notes, name })}
                        />
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div 
                        className="pagination-bar" 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          gap: '1rem', 
                          marginTop: '2rem',
                          padding: '0.5rem',
                          background: 'var(--bg-card)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          width: 'fit-content',
                          margin: '2rem auto 0 auto'
                        }}
                      >
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={activePage === 1}
                          style={{ padding: '0.4rem 0.8rem', minWidth: '40px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Previous Page"
                        >
                          &larr; Prev
                        </button>
                        
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', minWidth: '100px', textAlign: 'center' }}>
                          Page {activePage} of {totalPages}
                        </span>
                        
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={activePage === totalPages}
                          style={{ padding: '0.4rem 0.8rem', minWidth: '40px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Next Page"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* VIEW 2: POINT OF SALE CART CALCULATOR */}
            {activeTab === 'cart' && (
              <CartPOS
                cart={cart}
                products={products}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onCheckout={handleCheckout}
                onClearCart={handleClearCart}
              />
            )}

            {/* VIEW 3: SALES EARNINGS HISTORY */}
            {activeTab === 'history' && (
              <SalesHistory 
                sales={sales} 
                onClearHistory={handleClearSales} 
                onDeleteSale={handleDeleteSale} 
              />
            )}

            {/* VIEW 4: MOBILE SHARING & QR SETUP GUIDE */}
            {activeTab === 'guide' && (
              <MobileShareGuide serverInfo={serverInfo} />
            )}

            {/* VIEW 5: SETTINGS & CATEGORIES */}
            {activeTab === 'settings' && (
              <Settings
                products={products}
                categories={categories}
                salesCount={sales.length}
                onClearSales={handleClearSales}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onDeleteProduct={handleDeleteProduct}
                onEditProduct={setEditingProduct}
                logs={logs}
                onViewNote={(notes, name) => setViewingNote({ notes, name })}
                onRestoreSuccess={({ logs: updatedLogs, products: updatedProds, sales: updatedSales, categories: updatedCats }) => {
                  setLogs(updatedLogs);
                  setProducts(updatedProds);
                  setSales(updatedSales);
                  setCategories(updatedCats);
                }}
              />
            )}
          </>
        )}

        {/* Floating Action Button (FAB) for mobile view adding */}
        <button
          className="add-fab"
          onClick={() => setIsAddingProduct(true)}
          title="Add Product"
        >
          +
        </button>

        {/* Form Modal popup for adding a product */}
        {isAddingProduct && (
          <ProductForm
            categories={categories}
            onSave={handleSaveProduct}
            onClose={() => setIsAddingProduct(false)}
          />
        )}

        {/* Form Modal popup for editing a product */}
        {editingProduct && (
          <ProductForm
            product={editingProduct}
            categories={categories}
            onSave={handleSaveProduct}
            onDelete={handleDeleteProduct}
            onClose={() => setEditingProduct(null)}
          />
        )}

        {/* Lightbox full-screen viewer for product location maps */}
        {viewingImage && (
          <div className="lightbox-overlay" onClick={() => setViewingImage(null)}>
            <div className="lightbox-content" onClick={e => e.stopPropagation()}>
              <button className="btn-lightbox-close" onClick={() => setViewingImage(null)}>
                &times;
              </button>
              <img
                src={viewingImage.path}
                alt={viewingImage.name}
                className="lightbox-img"
              />
              <div className="lightbox-caption">
                <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>{viewingImage.name}</h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>📍 Location: {viewingImage.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal viewer for product notes */}
        {viewingNote && (
          <div className="modal-overlay" onClick={() => setViewingNote(null)}>
            <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📝 Product Notes
                </h2>
                <button className="btn-close" onClick={() => setViewingNote(null)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Product: <span style={{ color: 'var(--primary)' }}>{viewingNote.name}</span>
                </div>
                <p style={{ color: 'var(--text-main)', fontSize: '1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', background: 'var(--bg-app)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', margin: '0' }}>
                  {viewingNote.notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => handleSetActiveTab('inventory')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          <span>Shelves</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
          onClick={() => handleSetActiveTab('cart')}
        >
          <div style={{ position: 'relative' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="8" cy="21" r="1"/>
              <circle cx="19" cy="21" r="1"/>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
            </svg>
            {cartUniqueCount > 0 && (
              <span className="mobile-cart-badge">{cartUniqueCount}</span>
            )}
          </div>
          <span>Cart</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleSetActiveTab('history')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
            <line x1="16" x2="16" y1="2" y2="4"/>
            <line x1="8" x2="8" y1="2" y2="4"/>
            <line x1="3" x2="21" y1="10" y2="10"/>
          </svg>
          <span>History</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => handleSetActiveTab('guide')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
            <path d="M12 18h.01"/>
          </svg>
          <span>Connect</span>
        </button>
        <button
          className={`mobile-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleSetActiveTab('settings')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>Settings</span>
        </button>
      </nav>
    </>
  );
}

export default App;
