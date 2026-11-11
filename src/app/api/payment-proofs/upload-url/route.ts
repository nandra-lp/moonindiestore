import { forwardPaymentProofRequest } from "@/lib/server/payment-proof-proxy";

export async function POST(request: Request) {
  return forwardPaymentProofRequest(request, "upload-url", "POST");
}
