"use client";

import Link from "next/link";
import React from "react";
import { BrandMark } from "./ui";
import {
  Mail,
  MapPin,
  Phone,
  MessageSquare,
  Camera,
  Globe,
  Send,
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Produk & Layanan",
    links: [
      { href: "/register", label: "Katalog Produk", key: "katalog" },
      { href: "/register", label: "Estimasi Biaya", key: "estimasi" },
      { href: "/register", label: "Cara Pesan", key: "cara-pesan" },
      { href: "/contact", label: "Bantuan & FAQ", key: "bantuan" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { href: "/about", label: "Tentang Kami", key: "tentang" },
      { href: "/careers", label: "Karir", key: "karir" },
      { href: "/press", label: "Pers", key: "pers" },
      { href: "/partners", label: "Mitra", key: "mitra" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Kebijakan Privasi", key: "privasi" },
      { href: "/terms", label: "Syarat & Ketentuan", key: "syarat" },
      { href: "/cookies", label: "Kebijakan Cookie", key: "cookie" },
    ],
  },
];

const CONTACT_INFO = {
  address: "Jl. Raya Kembangan No. 123, Jakarta Barat 11520",
  email: "hello@moonindiestore.com",
  phone: "+62 21 1234 5678",
  whatsapp: "+62 812 3456 7890",
};

const SOCIAL_LINKS = [
  { href: "https://instagram.com/moonindiestore", icon: Camera, label: "Instagram" },
  { href: "https://facebook.com/moonindiestore", icon: Globe, label: "Facebook" },
  { href: "https://twitter.com/moonindiestore", icon: Send, label: "Twitter" },
  { href: `https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`, icon: MessageSquare, label: "WhatsApp" },
];

export function Footer() {
  const year = React.useState(() => new Date().getFullYear())[0];

  return (
    <footer className="bg-moon-ink text-white" role="contentinfo">
      <div className="flex h-1" aria-hidden="true">
        <span className="flex-[3] bg-moon-yellow" />
        <span className="flex-[2] bg-moon-blue" />
        <span className="flex-1 bg-moon-pink" />
      </div>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14 lg:py-18">
        <div className="grid gap-y-12 md:grid-cols-3 md:gap-x-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.75fr)_minmax(0,1fr)] lg:gap-x-14">
          <div className="min-w-0 md:col-span-1">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moon-yellow"
              aria-label="Moon Indie Store - Beranda"
            >
              <BrandMark className="h-12 w-12 shrink-0" plain />
              <span className="text-lg font-extrabold tracking-tight text-white">
                Moon Indie <span className="font-light">Store</span>
              </span>
            </Link>
            <p className="mb-7 max-w-xs text-sm leading-7 text-white/55">
              Partner produksi custom terpercaya untuk kreator, brand, & UMKM Indonesia.
              Dari desain hingga pengiriman — kami urus semuanya.
            </p>

            <div className="flex items-center gap-2.5">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors duration-200 hover:border-moon-yellow/50 hover:bg-moon-yellow/10 hover:text-moon-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-yellow"
                >
                  <social.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-9 md:col-span-2 md:grid-cols-3 md:gap-x-8 lg:col-span-1 lg:gap-x-6">
            {NAV_GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h3 className="mb-5 flex items-center gap-2.5 text-sm font-semibold text-white">
                  <span className="h-px w-5 bg-moon-yellow" aria-hidden="true" />
                  {group.title}
                </h3>
                <ul className="space-y-3.5" role="list">
                  {group.links.map((link) => (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        className="rounded-sm text-sm text-white/55 transition-colors duration-200 hover:text-moon-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-yellow"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="min-w-0 md:col-span-3 lg:col-span-1">
            <h3 className="mb-5 flex items-center gap-2.5 text-sm font-semibold text-white">
              <span className="h-px w-5 bg-moon-yellow" aria-hidden="true" />
              Hubungi Kami
            </h3>
            <address className="grid gap-4 text-sm leading-relaxed text-white/60 not-italic md:grid-cols-2 lg:grid-cols-1">
              <div className="flex min-w-0 items-start gap-2.5">
                <MapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-moon-yellow/90" aria-hidden="true" />
                <span>{CONTACT_INFO.address}</span>
              </div>
              <div className="flex min-w-0 items-center gap-2.5">
                <Mail className="h-[18px] w-[18px] shrink-0 text-moon-yellow/90" aria-hidden="true" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="break-all transition-colors duration-200 hover:text-moon-yellow">{CONTACT_INFO.email}</a>
              </div>
              <div className="flex min-w-0 items-center gap-2.5">
                <Phone className="h-[18px] w-[18px] shrink-0 text-moon-yellow/90" aria-hidden="true" />
                <a href={`tel:${CONTACT_INFO.phone}`} className="transition-colors duration-200 hover:text-moon-yellow">{CONTACT_INFO.phone}</a>
              </div>
              <div className="flex min-w-0 items-center gap-2.5">
                <MessageSquare className="h-[18px] w-[18px] shrink-0 text-moon-yellow/90" aria-hidden="true" />
                <a href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="transition-colors duration-200 hover:text-moon-yellow">
                  WhatsApp: {CONTACT_INFO.whatsapp}
                </a>
              </div>
            </address>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-7 sm:mt-14">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-center text-xs text-white/45 sm:text-left sm:text-sm">
              © {year} Moon Indie Store. Hak cipta dilindungi.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-white/45 sm:gap-x-5">
              <Link href="/privacy" className="hover:text-moon-yellow transition-colors duration-200">Kebijakan Privasi</Link>
              <span aria-hidden="true" className="text-white/25">·</span>
              <Link href="/terms" className="hover:text-moon-yellow transition-colors duration-200">Syarat & Ketentuan</Link>
              <span aria-hidden="true" className="text-white/25">·</span>
              <Link href="/cookies" className="hover:text-moon-yellow transition-colors duration-200">Kebijakan Cookie</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}