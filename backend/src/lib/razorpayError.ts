// The Razorpay Node SDK rejects with a plain { statusCode, error: { description } }
// object, not an Error instance - every other error in this codebase is
// thrown as Object.assign(new Error(message), { status }) and read that way
// by the controllers' catch blocks (err.status, err.message). Without this,
// a Razorpay API failure serializes to an empty {} response.
export function normalizeRazorpayError(err: any): Error & { status?: number } {
  const description = err?.error?.description || err?.message || "Razorpay request failed";
  return Object.assign(new Error(description), { status: err?.statusCode || 500 });
}
