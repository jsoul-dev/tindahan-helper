const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Directories setup
const isVercel = process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp/data' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'inventory.json');
const UPLOADS_DIR = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ products: [], sales: [], categories: [], logs: [] }, null, 2));
}

// Serve uploaded images statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Serve frontend build static files in production if dist exists
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Helper to get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        if (addr.address.startsWith('192.168.') || addr.address.startsWith('10.') || addr.address.startsWith('172.')) {
          return addr.address;
        }
      }
    }
  }
  return 'localhost';
}



function normalizeAuditLogs(db) {
  if (!Array.isArray(db.logs)) return false;

  let changed = false;
  db.logs = db.logs.map(log => {
    if (log.action === 'delete_product' && String(log.details || '').startsWith('Created product')) {
      changed = true;
      return { ...log, action: 'create_product', restorable: false };
    }
    return log;
  });

  return changed;
}

function normalizeProductName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function findProductByName(db, name, ignoredProductId = null) {
  const normalizedName = normalizeProductName(name);
  return (db.products || []).find(product =>
    product.id !== ignoredProductId && normalizeProductName(product.name) === normalizedName
  );
}

// Read database
function readDb() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    // Ensure structure is correct
    if (!db.products) db.products = [];
    if (!db.sales) db.sales = [];
    if (!db.categories) db.categories = [];
    if (!db.logs) db.logs = [];
    if (normalizeAuditLogs(db)) {
      writeDb(db);
    }
    return db;
  } catch (err) {
    console.error('Error reading DB:', err);
    return { products: [], sales: [], categories: [], logs: [] };
  }
}

// Write database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// Helper to log audit trail actions
function logAction(db, action, details, entityType, entityData, restorable = false) {
  const newLog = {
    id: 'log_' + Date.now() + '-' + Math.round(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    action,
    details,
    entityType,
    entityData,
    restorable
  };
  if (!db.logs) db.logs = [];
  db.logs.push(newLog);
  // Keep logs size at max 1000 entries
  if (db.logs.length > 1000) {
    db.logs.shift();
  }
  return newLog;
}

// Multer storage setup for product location images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get Server Info (Local IP & QR Code for mobile connection)
app.get('/api/server-info', async (req, res) => {
  try {
    const localIp = getLocalIpAddress();
    const port = PORT;
    const localUrl = `http://${localIp}:${port}`;
    const qrCodeDataUrl = await QRCode.toDataURL(localUrl);

    res.json({
      localIp,
      port,
      url: localUrl,
      qrCode: qrCodeDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate server info' });
  }
});

// GET all products
app.get('/api/products', (req, res) => {
  const db = readDb();
  res.json(db.products || []);
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const db = readDb();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// POST create product
app.post('/api/products', (req, res) => {
  const db = readDb();
  const { name, category, price, location, imagePath, locationImagePath, specialPrices, notes } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const cleanName = String(name).trim();
  if (!cleanName) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  const duplicateProduct = findProductByName(db, cleanName);
  if (duplicateProduct) {
    return res.status(409).json({ error: `A product named "${duplicateProduct.name}" already exists.` });
  }

  const cleanCategory = String(category || 'Uncategorized').trim();
  if (cleanCategory !== 'Uncategorized' && !db.categories.includes(cleanCategory)) {
    db.categories.push(cleanCategory);
    db.categories.sort((a, b) => a.localeCompare(b));
  }

  const newProduct = {
    id: 'prod_' + Date.now() + '-' + Math.round(Math.random() * 1000),
    name: cleanName,
    category: cleanCategory,
    price: Number(price),
    location: String(location || '').trim(),
    imagePath: imagePath || null,
    locationImagePath: locationImagePath || null,
    specialPrices: Array.isArray(specialPrices) ? specialPrices.map(sp => ({
      quantity: Number(sp.quantity),
      price: Number(sp.price)
    })) : [],
    notes: notes ? String(notes).trim() : '',
    updatedAt: new Date().toISOString(),
    priceUpdatedAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  logAction(db, 'create_product', `Created product "${newProduct.name}" (Price: ₱${newProduct.price.toFixed(2)})`, 'product', newProduct, false);
  if (writeDb(db)) {
    res.status(201).json(newProduct);
  } else {
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// PUT update product (supports PUT and POST fallback)
const updateProductHandler = (req, res) => {
  const db = readDb();
  const index = db.products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, category, price, location, imagePath, locationImagePath, specialPrices, notes } = req.body;
  const existing = db.products[index];

  if (imagePath && existing.imagePath && existing.imagePath !== imagePath) {
    const oldImagePath = path.join(__dirname, existing.imagePath);
    if (fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
      } catch (err) {
        console.error('Failed to delete old image:', err);
      }
    }
  }

  if (locationImagePath && existing.locationImagePath && existing.locationImagePath !== locationImagePath) {
    const oldLocPath = path.join(__dirname, existing.locationImagePath);
    if (fs.existsSync(oldLocPath)) {
      try {
        fs.unlinkSync(oldLocPath);
      } catch (err) {
        console.error('Failed to delete old location image:', err);
      }
    }
  }

  const cleanCategory = category !== undefined ? String(category).trim() : existing.category;
  if (cleanCategory !== 'Uncategorized' && !db.categories.includes(cleanCategory)) {
    db.categories.push(cleanCategory);
    db.categories.sort((a, b) => a.localeCompare(b));
  }

  const priceChanged = price !== undefined && Number(price) !== existing.price;
  const cleanName = name !== undefined ? String(name).trim() : existing.name;
  if (!cleanName) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  const duplicateProduct = findProductByName(db, cleanName, existing.id);
  if (duplicateProduct) {
    return res.status(409).json({ error: `A product named "${duplicateProduct.name}" already exists.` });
  }

  const updatedProduct = {
    ...existing,
    name: cleanName,
    category: cleanCategory,
    price: price !== undefined ? Number(price) : existing.price,
    location: location !== undefined ? String(location).trim() : existing.location,
    imagePath: imagePath !== undefined ? imagePath : existing.imagePath,
    locationImagePath: locationImagePath !== undefined ? locationImagePath : existing.locationImagePath,
    specialPrices: specialPrices !== undefined ? Array.isArray(specialPrices) ? specialPrices.map(sp => ({
      quantity: Number(sp.quantity),
      price: Number(sp.price)
    })) : [] : existing.specialPrices,
    notes: notes !== undefined ? String(notes).trim() : existing.notes,
    updatedAt: new Date().toISOString(),
    priceUpdatedAt: priceChanged ? new Date().toISOString() : (existing.priceUpdatedAt || existing.updatedAt)
  };

  if (priceChanged) {
    logAction(
      db,
      'update_price',
      `Updated price of "${updatedProduct.name}" from ₱${existing.price.toFixed(2)} to ₱${updatedProduct.price.toFixed(2)}`,
      'product',
      { productId: updatedProduct.id, oldPrice: existing.price, newPrice: updatedProduct.price, oldUpdatedAt: existing.priceUpdatedAt || existing.updatedAt },
      true
    );
  }

  db.products[index] = updatedProduct;
  if (writeDb(db)) {
    res.json(updatedProduct);
  } else {
    res.status(500).json({ error: 'Failed to save product changes' });
  }
};
app.put('/api/products/:id', updateProductHandler);
app.post('/api/products/:id/update', updateProductHandler);

// DELETE product (supports DELETE and POST fallback)
const deleteProductHandler = (req, res) => {
  const db = readDb();
  const index = db.products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const product = db.products[index];
  if (product.imagePath) {
    const imagePath = path.join(__dirname, product.imagePath);
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
      } catch (err) {
        console.error('Failed to delete product image:', err);
      }
    }
  }

  if (product.locationImagePath) {
    const locationImagePath = path.join(__dirname, product.locationImagePath);
    if (fs.existsSync(locationImagePath)) {
      try {
        fs.unlinkSync(locationImagePath);
      } catch (err) {
        console.error('Failed to delete location image:', err);
      }
    }
  }

  db.products.splice(index, 1);
  logAction(
    db,
    'delete_product',
    `Deleted product "${product.name}" (Category: ${product.category}, Price: ₱${product.price.toFixed(2)})`,
    'product',
    product,
    true
  );
  if (writeDb(db)) {
    res.json({ message: 'Product deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
app.delete('/api/products/:id', deleteProductHandler);
app.post('/api/products/:id/delete', deleteProductHandler);

// GET all sales transactions
app.get('/api/sales', (req, res) => {
  const db = readDb();
  res.json(db.sales || []);
});

// POST add a sales record
app.post('/api/sales', (req, res) => {
  const db = readDb();
  const { items, total } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0 || total === undefined) {
    return res.status(400).json({ error: 'Invalid sales record data' });
  }

  const newSale = {
    id: 'sale_' + Date.now() + '-' + Math.round(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    items: items.map(item => ({
      productId: item.productId,
      name: String(item.name),
      quantity: Number(item.quantity),
      pricePaid: Number(item.pricePaid)
    })),
    total: Number(total)
  };

  db.sales.push(newSale);
  logAction(
    db,
    'checkout',
    `Checkout completed for ₱${newSale.total.toFixed(2)} (${items.length} item(s))`,
    'receipt',
    newSale,
    false
  );
  if (writeDb(db)) {
    res.status(201).json(newSale);
  } else {
    res.status(500).json({ error: 'Failed to save sales transaction' });
  }
});

// DELETE clear all sales transactions (supports DELETE and POST fallback)
const clearSalesHandler = (req, res) => {
  const db = readDb();
  db.sales = [];
  if (writeDb(db)) {
    res.json({ message: 'Sales transaction history cleared' });
  } else {
    res.status(500).json({ error: 'Failed to clear sales history' });
  }
};
app.delete('/api/sales', clearSalesHandler);
app.post('/api/sales/clear', clearSalesHandler);

// DELETE a specific sales transaction (supports DELETE and POST fallback)
const deleteSaleHandler = (req, res) => {
  const db = readDb();
  const index = db.sales.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Sale record not found' });
  }

  const sale = db.sales[index];
  db.sales.splice(index, 1);
  logAction(
    db,
    'delete_receipt',
    `Deleted sales receipt for ₱${sale.total.toFixed(2)}`,
    'receipt',
    sale,
    true
  );
  if (writeDb(db)) {
    res.json({ message: 'Sale record deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete sale record' });
  }
};
app.delete('/api/sales/:id', deleteSaleHandler);
app.post('/api/sales/:id/delete', deleteSaleHandler);

// GET all categories
app.get('/api/categories', (req, res) => {
  const db = readDb();
  const sorted = (db.categories || []).sort((a, b) => a.localeCompare(b));
  res.json(sorted);
});

// POST add a category
app.post('/api/categories', (req, res) => {
  const db = readDb();
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const cleanName = String(name).trim();
  if (db.categories.includes(cleanName)) {
    return res.status(400).json({ error: 'Category already exists' });
  }
  db.categories.push(cleanName);
  if (writeDb(db)) {
    res.status(201).json(db.categories.sort((a, b) => a.localeCompare(b)));
  } else {
    res.status(500).json({ error: 'Failed to save category' });
  }
});

// PUT update a category name (cascade update to all products - supports PUT and POST fallback)
const updateCategoryHandler = (req, res) => {
  const db = readDb();
  const { oldName, newName } = req.body;
  if (!oldName || !newName || !String(newName).trim()) {
    return res.status(400).json({ error: 'Both old and new category names are required' });
  }
  const cleanOldName = String(oldName).trim();
  const cleanNewName = String(newName).trim();
  const index = db.categories.indexOf(cleanOldName);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  if (db.categories.includes(cleanNewName) && cleanOldName !== cleanNewName) {
    return res.status(400).json({ error: 'New category name already exists' });
  }
  db.categories[index] = cleanNewName;

  // Cascade update products
  db.products = db.products.map(p => {
    if (p.category === cleanOldName) {
      return { ...p, category: cleanNewName, updatedAt: new Date().toISOString() };
    }
    return p;
  });

  if (writeDb(db)) {
    res.json({ categories: db.categories.sort((a, b) => a.localeCompare(b)), products: db.products });
  } else {
    res.status(500).json({ error: 'Failed to update category name' });
  }
};
app.put('/api/categories', updateCategoryHandler);
app.post('/api/categories/update', updateCategoryHandler);

// DELETE a category (cascade set products to 'Uncategorized' - supports DELETE and POST fallback)
const deleteCategoryHandler = (req, res) => {
  const db = readDb();
  const name = req.query.name || req.body.name;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  const cleanName = String(name).trim();
  const index = db.categories.indexOf(cleanName);
  if (index === -1) {
    return res.status(404).json({ error: 'Category not found' });
  }
  db.categories.splice(index, 1);

  const affectedProducts = db.products.filter(p => p.category === cleanName);
  const affectedProductIds = affectedProducts.map(p => p.id);

  // Cascade update products to 'Uncategorized'
  db.products = db.products.map(p => {
    if (p.category === cleanName) {
      return { ...p, category: 'Uncategorized', updatedAt: new Date().toISOString() };
    }
    return p;
  });

  logAction(
    db,
    'delete_category',
    `Deleted category "${cleanName}" (affected ${affectedProductIds.length} product(s))`,
    'category',
    { name: cleanName, affectedProductIds },
    true
  );

  if (writeDb(db)) {
    res.json({ categories: db.categories.sort((a, b) => a.localeCompare(b)), products: db.products });
  } else {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
app.delete('/api/categories', deleteCategoryHandler);
app.post('/api/categories/delete', deleteCategoryHandler);

// POST upload product image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const relativePath = `/uploads/${req.file.filename}`;
  res.json({ imagePath: relativePath });
});

// GET all audit log entries
app.get('/api/logs', (req, res) => {
  const db = readDb();
  // Return logs reversed so newest entries are at the top
  res.json((db.logs || []).slice().reverse());
});

// POST restore log entry
app.post('/api/logs/:id/restore', (req, res) => {
  const db = readDb();
  const logIndex = db.logs.findIndex(l => l.id === req.params.id);
  if (logIndex === -1) {
    return res.status(404).json({ error: 'Log entry not found' });
  }
  const log = db.logs[logIndex];
  if (!log.restorable) {
    return res.status(400).json({ error: 'This action is not restorable' });
  }

  try {
    if (log.action === 'delete_product') {
      const restoredProduct = log.entityData;
      const exists = db.products.some(p => p.id === restoredProduct.id);
      if (exists) {
        return res.status(400).json({ error: 'Product already exists' });
      }
      db.products.push(restoredProduct);
      if (restoredProduct.category !== 'Uncategorized' && !db.categories.includes(restoredProduct.category)) {
        db.categories.push(restoredProduct.category);
        db.categories.sort((a, b) => a.localeCompare(b));
      }
      logAction(db, 'restore_product', `Restored product "${restoredProduct.name}"`, 'product', null, false);
    }
    else if (log.action === 'delete_category') {
      const { name, affectedProductIds } = log.entityData;
      if (!db.categories.includes(name)) {
        db.categories.push(name);
        db.categories.sort((a, b) => a.localeCompare(b));
      }
      db.products = db.products.map(p => {
        if (affectedProductIds.includes(p.id) && p.category === 'Uncategorized') {
          return { ...p, category: name, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      logAction(db, 'restore_category', `Restored category "${name}"`, 'category', null, false);
    }
    else if (log.action === 'delete_receipt') {
      const restoredReceipt = log.entityData;
      const exists = db.sales.some(s => s.id === restoredReceipt.id);
      if (exists) {
        return res.status(400).json({ error: 'Sales receipt already exists' });
      }
      db.sales.push(restoredReceipt);
      db.sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      logAction(db, 'restore_receipt', `Restored sales receipt for ₱${restoredReceipt.total.toFixed(2)}`, 'receipt', null, false);
    }
    else if (log.action === 'update_price') {
      const { productId, oldPrice, oldUpdatedAt } = log.entityData;
      const prodIndex = db.products.findIndex(p => p.id === productId);
      if (prodIndex === -1) {
        return res.status(404).json({ error: 'Product to restore price for not found' });
      }
      const prod = db.products[prodIndex];
      const prevPrice = prod.price;
      prod.price = oldPrice;
      prod.priceUpdatedAt = oldUpdatedAt;
      prod.updatedAt = new Date().toISOString();
      logAction(db, 'restore_price', `Restored price of "${prod.name}" from ₱${prevPrice.toFixed(2)} back to ₱${oldPrice.toFixed(2)}`, 'product', null, false);
    }

    // Mark the entry as no longer restorable
    db.logs[logIndex].restorable = false;

    if (writeDb(db)) {
      res.json({ message: 'Restoration completed successfully', logs: db.logs.slice().reverse(), products: db.products, sales: db.sales, categories: db.categories });
    } else {
      res.status(500).json({ error: 'Failed to write DB changes' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error during restoration: ' + err.message });
  }
});

// For wildcard requests in production, serve React frontend
if (fs.existsSync(frontendDist)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Handle global Express errors
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    const localIp = getLocalIpAddress();
    console.log(`===============================================`);
    console.log(`  Tindahan Helper Backend Running Locally!`);
    console.log(`  - Local PC:  http://localhost:${PORT}`);
    console.log(`  - Wi-Fi IP:  http://${localIp}:${PORT}`);
    console.log(`===============================================\n`);
  });
}

module.exports = app;
