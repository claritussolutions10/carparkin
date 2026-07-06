export function generateMockPaymentId(): string {
  return `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export async function processPayment(
  bookingId: string,
  amount: number,
  forceFailure: boolean = false
): Promise<{ success: boolean; paymentId: string; status: string; message: string }> {
  const paymentId = generateMockPaymentId();
  const success = !forceFailure;
  return {
    success,
    paymentId,
    status: success ? "completed" : "failed",
    message: success
      ? "Test payment processed successfully"
      : "Test payment failed (forced failure)",
  };
}

export function verifyPayment(paymentId: string): { verified: boolean; status: string } {
  const verified = paymentId.startsWith("pay_test_") || paymentId.startsWith("pay_");
  return { verified, status: verified ? "completed" : "failed" };
}

export function getPaymentDetails(paymentId: string, amount?: number) {
  return {
    id: paymentId,
    amount: amount ?? 0,
    currency: "INR",
    status: "completed",
    method: "test",
    testMode: true,
  };
}
