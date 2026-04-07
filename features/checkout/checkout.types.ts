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

export type OrderEtaMinutes = 15 | 30 | 45 | 60;

export type CancellationActor = "admin" | "customer";

export type PlacedOrder = {
  ref: string;
  placedAt: string; // ISO string
  status: OrderStatus;
  etaMinutes?: OrderEtaMinutes | null;
  cancellationNote?: string | null;
  cancelledBy?: CancellationActor | null;
  form: CheckoutForm;
  orders: import("@/features/cart/cart.types").OrderEntry[];
  totalPrice: number;
};

export type CreateOrderInput = Pick<PlacedOrder, "form" | "orders" | "totalPrice">;
