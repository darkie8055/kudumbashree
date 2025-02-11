export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description: string;
  unit: string;
  phone: string;
  category: string;
  location: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}