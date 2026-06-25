export interface SpecialPrice {
  quantity: number;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;              // Standard retail price
  location: string;           // Shelf location description
  imagePath: string | null;   // Product photo path
  locationImagePath: string | null; // Shelf map photo path
  specialPrices: SpecialPrice[]; // Bulk pricing rules
  notes?: string;             // Optional product notes
  updatedAt: string;
  priceUpdatedAt?: string;
}

export interface ServerInfo {
  localIp: string;
  port: number;
  url: string;
  qrCode: string;
}

export interface SaleRecordItem {
  productId: string;
  name: string;
  quantity: number;
  pricePaid: number;          // Total calculated price for this quantity
}

export interface SaleRecord {
  id: string;
  timestamp: string;
  items: SaleRecordItem[];
  total: number;              // Grand total for transaction
}

export interface CartItem {
  product: Product;
  quantity: number;
  calculatedPrice: number;    // Calculated price based on standard and bulk prices
}
