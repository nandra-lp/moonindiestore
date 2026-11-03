"use client";

import Link from "next/link";
import { BrandMark } from "./ui";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiMessageCircle,
} from "react-icons/fi";
import {
  FaInstagram,
  FaFacebook,
  FaTwitter,
} from "react-icons/fa6";

const CONTACT_INFO = {
  address: "Jl. Raya Kembangan No. 123, Jakarta Barat 11520",
  email: "hello@moonindiestore.com",
  phone: "+62 21 1234 5678",
  whatsapp: "+62 812 3456 7890",
};

const SOCIAL_LINKS = [
  { href: "https://instagram.com/moonindiestore", Icon: FaInstagram, label: "Instagram" },
  { href: "https://facebook.com/moonindiestore", Icon: FaFacebook, label: "Facebook" },
  { href: "https://twitter.com/moonindiestore", Icon: FaTwitter, label: "Twitter" },
  { href: `https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`, Icon: FiMessageCircle, label: "WhatsApp" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-moon-ink text-white" role="contentinfo">
      <div className="flex h-1" aria-hidden="true">
        <span className="flex-[3] bg-moon-yellow" />
        <span className="flex-[2] bg-moon-blue" />
        <span className="flex-1 bg-moon-pink" />
      </div>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-11 lg:py-12">
        <div className="grid gap-9 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-12 lg:gap-20">
          <div className="min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moon-yellow"
              aria-label="Moon Indie Store - Beranda"
            >
              <BrandMark className="h-10 w-10 shrink-0" plain />
              <span className="text-lg font-extrabold tracking-tight text-white">
                Moon Indie <span className="font-light">Store</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              Partner produksi custom untuk kreator, brand, dan UMKM Indonesia.
              Dari desain hingga siap dikirim.
            </p>

            <nav aria-label="Media sosial" className="mt-5 flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-moon-yellow/70 hover:text-moon-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-yellow"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>

          <section aria-labelledby="footer-contact-title" className="min-w-0 sm:pt-1">
            <h2 id="footer-contact-title" className="text-sm font-semibold text-white">
              Hubungi kami
            </h2>
            <address className="mt-4 grid gap-x-6 gap-y-4 text-sm leading-5 text-white/70 not-italic sm:grid-cols-2">
              <a
                href={`tel:${CONTACT_INFO.phone}`}
                className="flex min-w-0 items-start gap-2.5 transition-colors hover:text-moon-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moon-yellow"
              >
                <FiPhone className="mt-0.5 h-4 w-4 shrink-0 text-moon-yellow" aria-hidden="true" />
                <span>{CONTACT_INFO.phone}</span>
              </a>
              <a
                href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-start gap-2.5 transition-colors hover:text-moon-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moon-yellow"
              >
                <FiMessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-moon-yellow" aria-hidden="true" />
                <span>WhatsApp: {CONTACT_INFO.whatsapp}</span>
              </a>
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className="flex min-w-0 items-start gap-2.5 break-all transition-colors hover:text-moon-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moon-yellow"
              >
                <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-moon-yellow" aria-hidden="true" />
                <span>{CONTACT_INFO.email}</span>
              </a>
              <div className="flex min-w-0 items-start gap-2.5 sm:col-span-2">
                <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-moon-yellow" aria-hidden="true" />
                <span>{CONTACT_INFO.address}</span>
              </div>
            </address>
          </section>
        </div>

        <div className="mt-9 border-t border-white/15 pt-5">
          <p className="text-center text-xs text-white/55">
            © {year} Moon Indie Store. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
