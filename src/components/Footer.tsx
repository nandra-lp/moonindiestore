"use client";

import Link from "next/link";
import { BrandMark } from "./ui";
import {
  Globe,
  Camera,
  Send,
  Mail,
  MapPin,
  Phone,
  MessageSquare,
} from "lucide-react";

const NAV_GROUPS = [
  {
    title: "Produk & Layanan",
    links: [
      { href: "/register", label: "Katalog Produk" },
      { href: "/register", label: "Estimasi Biaya" },
      { href: "/register", label: "Cara Pesan" },
      { href: "/contact", label: "Bantuan & FAQ" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { href: "/about", label: "Tentang Kami" },
      { href: "/careers", label: "Karir" },
      { href: "/press", label: "Pers" },
      { href: "/partners", label: "Mitra" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Kebijakan Privasi" },
      { href: "/terms", label: "Syarat & Ketentuan" },
      { href: "/cookies", label: "Kebijakan Cookie" },
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
  return (
    <footer
      className="bg-moon-ink text-white"
      role="contentinfo"
    >
      <div className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 mb-4"
              aria-label="Moon Indie Store - Beranda"
            >
              <BrandMark className="h-10 w-10" plain />
              <span className="font-extrabold tracking-tight text-white">
                Moon Indie <span className="font-light">Store</span>
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Partner produksi custom terpercaya untuk kreator, brand, & UMKM Indonesia.
              Dari desain hingga pengiriman — kami urus semuanya.
            </p>
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all duration-200 hover:bg-moon-yellow hover:text-moon-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-yellow"
                >
                  <social.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {NAV_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="font-semibold text-white mb-3">{group.title}</h3>
              <ul className="space-y-2" role="list">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-moon-yellow transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moon-yellow rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact column */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold text-white mb-3">Hubungi Kami</h3>
            <address className="not-italic space-y-3 text-sm text-white/70">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-moon-yellow flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{CONTACT_INFO.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-moon-yellow flex-shrink-0" aria-hidden="true" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-moon-yellow transition-colors">{CONTACT_INFO.email}</a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-moon-yellow flex-shrink-0" aria-hidden="true" />
                <a href={`tel:${CONTACT_INFO.phone}`} className="hover:text-moon-yellow transition-colors">{CONTACT_INFO.phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-moon-yellow flex-shrink-0" aria-hidden="true" />
                <a href={`https://wa.me/${CONTACT_INFO.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-moon-yellow transition-colors">
                  WhatsApp: {CONTACT_INFO.whatsapp}
                </a>
              </div>
            </address>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-white/50">
              © {new Date().getFullYear()} Moon Indie Store. Hak cipta dilindungi.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <Link href="/privacy" className="hover:text-moon-yellow transition-colors">Privasi</Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms" className="hover:text-moon-yellow transition-colors">Syarat</Link>
              <span aria-hidden="true">·</span>
              <Link href="/cookies" className="hover:text-moon-yellow transition-colors">Cookie</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}