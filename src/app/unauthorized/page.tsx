import { BrandMark, Card, ErrorBox, PrimaryLink } from "@/components/ui";

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <Card className="text-center">
        <div className="flex justify-center">
          <BrandMark className="h-12 w-12" />
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-moon-ink">403 — Akses ditolak</h1>
        <div className="mt-3">
          <ErrorBox>Role kamu tidak diizinkan membuka halaman ini.</ErrorBox>
        </div>
        <PrimaryLink href="/dashboard" className="mt-6 w-full">
          Kembali ke dashboard saya
        </PrimaryLink>
      </Card>
    </main>
  );
}
