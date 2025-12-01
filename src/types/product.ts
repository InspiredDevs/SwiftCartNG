export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  description: string;
  in_stock: boolean;
  rating: number;
  stock_quantity: number;
  seller_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
