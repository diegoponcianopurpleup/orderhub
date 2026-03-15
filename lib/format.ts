export function toMoney(value: number | string, currency = "BRL") {
  const amount = typeof value === "string" ? Number(value) : value;
  return amount.toLocaleString("pt-BR", { style: "currency", currency });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function toDecimal(value: number) {
  return Number(value.toFixed(2));
}
