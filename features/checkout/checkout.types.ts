export type FulfillmentType = "pickup" | "delivery";

export type PaymentMethod = "cash" | "card";

export type DeliveryAddress = {
  address1: string;
  city: string;
  state: string;
  postcode: string;
};

export type CheckoutForm = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  fulfillment: FulfillmentType;
  deliveryAddress: DeliveryAddress;
  comment: string;
  payment: PaymentMethod;
  termsAgreed: boolean;
};

export type OrderStatus = "pending" | "in_progress" | "ready" | "completed" | "cancelled";

export type PlacedOrder = {
  ref: string;
  placedAt: string; // ISO string
  status: OrderStatus;
  form: CheckoutForm;
  orders: import("@/features/cart/cart.types").OrderEntry[];
  totalPrice: number;
};

export type CreateOrderInput = Pick<PlacedOrder, "form" | "orders" | "totalPrice">;
