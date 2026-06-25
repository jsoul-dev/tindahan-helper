import type { Product, ServerInfo, SaleRecord, SaleRecordItem } from './types';

async function getApiErrorMessage(res: Response, fallback: string) {
  const text = await res.text();
  if (!text) return fallback;

  try {
    const data = JSON.parse(text);
    return data.error || fallback;
  } catch {
    return text;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function fetchServerInfo(): Promise<ServerInfo> {
  const res = await fetch('/api/server-info');
  if (!res.ok) throw new Error('Failed to fetch server info');
  return res.json();
}

export async function createProduct(product: Omit<Product, 'id' | 'updatedAt'>): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error(await getApiErrorMessage(res, 'Failed to create product'));
  return res.json();
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/products/${id}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error(await getApiErrorMessage(res, 'Failed to update product'));
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`/api/products/${id}/delete`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to delete product');
}

export async function fetchSales(): Promise<SaleRecord[]> {
  const res = await fetch('/api/sales');
  if (!res.ok) throw new Error('Failed to fetch sales history');
  return res.json();
}

export async function recordSale(items: SaleRecordItem[], total: number): Promise<SaleRecord> {
  const res = await fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, total }),
  });
  if (!res.ok) throw new Error('Failed to record sales transaction');
  return res.json();
}

export async function clearSalesHistory(): Promise<void> {
  const res = await fetch('/api/sales/clear', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to clear sales history');
}

export async function deleteSale(id: string): Promise<void> {
  const res = await fetch(`/api/sales/${id}/delete`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to delete sale record');
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to upload image');
  }
  
  const data = await res.json();
  return data.imagePath;
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function createCategory(name: string): Promise<string[]> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorText = await res.json();
    throw new Error(errorText.error || 'Failed to create category');
  }
  return res.json();
}

export async function updateCategory(oldName: string, newName: string): Promise<{ categories: string[]; products: Product[] }> {
  const res = await fetch('/api/categories/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldName, newName }),
  });
  if (!res.ok) {
    const errorText = await res.json();
    throw new Error(errorText.error || 'Failed to update category name');
  }
  return res.json();
}

export async function deleteCategory(name: string): Promise<{ categories: string[]; products: Product[] }> {
  const res = await fetch(`/api/categories/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errorText = await res.json();
    throw new Error(errorText.error || 'Failed to delete category');
  }
  return res.json();
}

export async function fetchAuditLogs(): Promise<any[]> {
  const res = await fetch('/api/logs');
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function restoreLogEntry(id: string): Promise<any> {
  const res = await fetch(`/api/logs/${id}/restore`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Failed to restore log entry');
  }
  return res.json();
}
