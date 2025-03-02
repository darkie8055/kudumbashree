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
  pincode: string;
  district: string;
  status?: "pending" | "approved" | "rejected";
  createdAt?: Date;
  createdBy?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Add ToastConfig type for consistent toast messages
export interface ToastConfigParams {
  text1?: string;
  text2?: string;
  type?: "success" | "error" | "info";
  position?: "top" | "bottom";
  visibilityTime?: number;
  autoHide?: boolean;
  topOffset?: number;
  bottomOffset?: number;
}
