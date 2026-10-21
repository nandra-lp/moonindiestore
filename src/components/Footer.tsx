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
      {/* Subtle gradient top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-moon-yellow/40 to-transparent" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
        <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-[1.5fr_2fr_1.5fr_1.5fr]">
          {/* Brand column */}
          <div className="lg:col-span-1 max-w-xs">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5" aria-label="Moon Indie Store - Beranda">
              <BrandMark className="h-11 w-11 shrink-0" plain />
              <span className="font-extrabold tracking-tight text-white text-lg">
                Moon Indie <span className="font-light">Store</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-8 max-w-xs">
              Partner produksi custom terpercaya untuk kreator, brand, & UMKM Indonesia.
              Dari desain hingga pengiriman — kami urus semuanya.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/60 transition-all duration-200 hover:bg-moon-yellow/20 hover:text-moon-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-yellow"
                >
                  <social.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:grid-cols-3">
            {NAV_GROUPS.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h3 className="font-medium text-white mb-4 tracking-wide text-sm">{group.title}</h3>
                <ul className="space-y-3" role="list">
                  {group.links.map((link) => (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/60 hover:text-moon-yellow transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-yellow rounded-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Contact column */}
          <div className="lg:col-span-1">
            <h3 className="font-medium text-white mb-5 tracking-wide text-sm">Hubungi Kami</h3>
            <address className="not-italic space-y-4 text-sm text-white/60 leading-relaxed">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-moon-yellow/80 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-relaxed">{CONTACT_INFO.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-moon-yellow/80 flex-shrink-0" aria-hidden="true" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-moon-yellow transition-colors duration-200">{CONTACT_INFO.email}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-moon-yellow/80 flex-shrink-0" aria-hidden="true" />
                <a href={`tel:${CONTACT_INFO.phone}`} className="hover:text-moon-yellow transition-colors duration-200">{CONTACT_INFO.phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-moon-yellow/80 flex-shrink-0" aria-hidden="true" />
                <a href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-moon-yellow transition-colors duration-200">
                  WhatsApp: {CONTACT_INFO.whatsapp}
                </a>
              </div>
            </address>
          </div>
        </div>

        {/* Elegant divider & Copyright */}
        <div className="mt-14 pt-8 border-t border-white/5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-center">
            <p className="text-sm text-white/40 text-center sm:text-left">
              © {year} Moon Indie Store. Hak cipta dilindungi.
            </p>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <Link href="/privacy" className="hover:text-moon-yellow transition-colors duration-200">Kebijakan Privasi</Link>
              <span aria-hidden="true" className="text-white/20">·</span>
              <Link href="/terms" className="hover:text-moon-yellow transition-colors duration-200">Syarat & Ketentuan</Link>
              <span aria-hidden="true" className="text-white/20">·</span>
              <Link href="/cookies" className="hover:text-moon-yellow transition-colors duration-200">Kebijakan Cookie</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}