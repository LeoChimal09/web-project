import type { MenuItem } from "@/components/customer/MenuCard";

export type CartItem = MenuItem & {
  cartQuantity: number;
};

export type OrderEntry = {
  orderId: string;
  lines: CartItem[];
  total: number;
};

export type Cart = {
  orders: OrderEntry[];
  totalOrders: number;
  totalPrice: number;
};
