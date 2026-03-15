export const ORDER_TYPES = [
  { value: "COUNTER", label: "Balcão" },
  { value: "PICKUP", label: "Retirada" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "TABLE", label: "Mesa" }
] as const;

export const PAYMENT_METHODS = [
  { value: "PIX", label: "Pix" },
  { value: "CASH", label: "Dinheiro" },
  { value: "CARD", label: "Cartão" }
] as const;

export const PREP_STATUSES = [
  { value: "NEW", label: "Novo" },
  { value: "PREPARING", label: "Em preparo" },
  { value: "READY", label: "Pronto" },
  { value: "DELIVERED", label: "Entregue" }
] as const;
