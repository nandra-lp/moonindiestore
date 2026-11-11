import { forwardPaymentProofRequest } from "@/lib/server/payment-proof-proxy";

type RouteContext = { params: Promise<{ orderId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { orderId } = await params;
  return forwardPaymentProofRequest(request, encodeURIComponent(orderId), "GET");
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const { orderId } = await params;
  return forwardPaymentProofRequest(request, encodeURIComponent(orderId), "DELETE");
}
