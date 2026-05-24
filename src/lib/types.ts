export type StockWithWarehouse = {
  id: string;
  productId: string;
  warehouseId: string;
  total: number;
  reserved: number;
  available: number;
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: StockWithWarehouse[];
};

export type Reservation = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  warehouse: {
    id: string;
    name: string;
    location: string;
  };
};