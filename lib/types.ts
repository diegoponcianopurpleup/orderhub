export type Category = {
  id: string;
  name: string;
  isActive: boolean;
  position: number;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isActive: boolean;
  outOfStock: boolean;
  position: number;
  categoryId: string | null;
  category?: Category | null;
};

export type Addon = {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  outOfStock: boolean;
  products?: Array<{ productId: string; addonId: string }>;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  _count?: { orders: number };
};
