import { Decimal } from "@prisma/client/runtime/library";

export function decimalToNumber(value: Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}
