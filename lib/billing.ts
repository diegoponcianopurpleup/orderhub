export function isBillingEnabled() {
  return process.env.BILLING_ENABLED === "true";
}

export function getBillingProvider() {
  return process.env.BILLING_PROVIDER || "mock";
}

export type ChargeResult = {
  success: boolean;
  externalRef?: string;
  message?: string;
};

export async function createChargeForSubscription(input: {
  companyId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
}) : Promise<ChargeResult> {
  if (!isBillingEnabled()) {
    return {
      success: false,
      externalRef: "billing-disabled",
      message: "Cobrança desativada (modo desenvolvimento)."
    };
  }

  const provider = getBillingProvider();

  // Placeholder para integração futura real (Stripe/Asaas/etc).
  if (provider === "mock") {
    return {
      success: true,
      externalRef: `mock_${input.companyId}_${Date.now()}`
    };
  }

  return {
    success: false,
    message: `Provider não implementado: ${provider}`
  };
}
