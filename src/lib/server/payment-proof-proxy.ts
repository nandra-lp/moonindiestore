import "server-only";

const MAX_PROXY_BODY_BYTES = 16 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

function jsonResponse(body: Record<string, string>, status: number) {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function forwardPaymentProofRequest(
  request: Request,
  path: string,
  method: "GET" | "POST" | "DELETE"
) {
  const configuredBaseUrl = process.env.PAYMENT_PROOF_API_BASE_URL;
  if (!configuredBaseUrl) {
    console.error("PAYMENT_PROOF_API_BASE_URL is not configured.");
    return jsonResponse(
      { code: "payment-api-unavailable", error: "Layanan bukti pembayaran belum dikonfigurasi." },
      503
    );
  }

  let endpoint: URL;
  try {
    const base = new URL(configuredBaseUrl);
    const isLocalHttp =
      base.protocol === "http:" &&
      (base.hostname === "localhost" || base.hostname === "127.0.0.1");
    if (
      (base.protocol !== "https:" && !isLocalHttp) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    ) {
      throw new Error("Invalid payment API base URL.");
    }

    const basePath = base.pathname.endsWith("/") ? base.pathname : `${base.pathname}/`;
    endpoint = new URL(path.replace(/^\/+/, ""), `${base.origin}${basePath}`);
    if (endpoint.origin !== base.origin || !endpoint.pathname.startsWith(basePath)) {
      throw new Error("Invalid payment API path.");
    }
  } catch {
    console.error("PAYMENT_PROOF_API_BASE_URL is invalid.");
    return jsonResponse(
      { code: "payment-api-unavailable", error: "Layanan bukti pembayaran belum dikonfigurasi." },
      503
    );
  }

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  let body: string | undefined;
  if (method === "POST") {
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_PROXY_BODY_BYTES) {
      return jsonResponse(
        { code: "request-too-large", error: "Permintaan unggah tidak valid." },
        413
      );
    }

    body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_PROXY_BODY_BYTES) {
      return jsonResponse(
        { code: "request-too-large", error: "Permintaan unggah tidak valid." },
        413
      );
    }
  }

  try {
    const upstream = await fetch(endpoint, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: request.signal,
    });
    const responseHeaders = new Headers(NO_STORE);
    const responseType = upstream.headers.get("content-type");
    if (responseType) responseHeaders.set("content-type", responseType);
    const allow = upstream.headers.get("allow");
    if (allow) responseHeaders.set("allow", allow);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(
      "Firebase payment-proof API request failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return jsonResponse(
      { code: "payment-api-unavailable", error: "Layanan bukti pembayaran sedang tidak tersedia." },
      502
    );
  }
}
