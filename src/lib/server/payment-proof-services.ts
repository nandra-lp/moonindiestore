import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const PAYMENT_PROOFS_BUCKET = "payment-proofs";
export const PAYMENT_PROOF_URL_MARKER = "supabase:private";
export const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024;
export const PAYMENT_PROOF_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];

let supabaseClient: SupabaseClient | undefined;

export function getSupabaseAdmin() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  supabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return supabaseClient;
}

export function getPaymentProofPath(orderId: string, uid: string) {
  return `bukti-pembayaran/${orderId}/${uid}`;
}
