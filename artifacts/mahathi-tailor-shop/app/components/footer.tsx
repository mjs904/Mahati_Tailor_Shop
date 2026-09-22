import Link from 'next/link';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 bg-[#171717] text-white">
      <div className="market-container grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-xs font-bold text-[#4f6bff]">
              M
            </span>
            <span className="leading-[1.05]">
              <strong className="block text-[14px] font-extrabold tracking-[-.04em]">mahathi</strong>
              <small className="font-label text-[8px] uppercase tracking-[.16em] text-[#aaa]">
                tailor shop
              </small>
            </span>
          </div>
          <p className="mt-4 max-w-[260px] text-[12px] leading-6 text-[#a9a6a3]">
            Curated Indian occasionwear, everyday handcrafted pieces, and bespoke tailoring crafted to your exact fit.
          </p>
          <div className="mt-5 flex gap-2.5">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3d3d3d] text-[#aaa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
              aria-label="Instagram"
            >
              <Instagram size={14} />
            </a>
            <a
              href="mailto:contact@mahathitailor.in"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#3d3d3d] text-[#aaa] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
              aria-label="Email boutique"
            >
              <Mail size={14} />
            </a>
          </div>
        </div>

        {/* Collections */}
        <div>
          <h3 className="font-label text-[9px] uppercase tracking-[.16em] text-[#d4af37]">
            Collections
          </h3>
          <div className="mt-4 flex flex-col gap-2.5 text-[12px] text-[#c5c2bf]">
            <Link href="/shop" className="hover:text-white transition-colors">
              Explore All Pieces
            </Link>
            <Link href="/shop?category=Sarees" className="hover:text-white transition-colors">
              Sarees & Drapes
            </Link>
            <Link href="/shop?category=Lehengas" className="hover:text-white transition-colors">
              Festive Lehengas
            </Link>
            <Link href="/shop?category=Kurtis" className="hover:text-white transition-colors">
              Handcrafted Kurtis
            </Link>
            <Link href="/shop?category=Bridal" className="hover:text-white transition-colors">
              Bridal Couture
            </Link>
          </div>
        </div>

        {/* Services & Craft */}
        <div>
          <h3 className="font-label text-[9px] uppercase tracking-[.16em] text-[#d4af37]">
            Bespoke Services
          </h3>
          <div className="mt-4 flex flex-col gap-2.5 text-[12px] text-[#c5c2bf]">
            <Link href="/services/tailoring" className="hover:text-white transition-colors">
              Custom Tailoring & Stitching
            </Link>
            <Link href="/services/bridal" className="hover:text-white transition-colors">
              Bridal & Maggam / Aari Handwork
            </Link>
            <Link href="/appointments" className="hover:text-white transition-colors">
              Book Studio Fitting Appointment
            </Link>
            <Link href="/measurements" className="hover:text-white transition-colors">
              My Saved Measurements
            </Link>
          </div>
        </div>

        {/* Studio & Account */}
        <div>
          <h3 className="font-label text-[9px] uppercase tracking-[.16em] text-[#d4af37]">
            Visit Studio
          </h3>
          <div className="mt-4 flex flex-col gap-3 text-[12px] leading-5 text-[#c5c2bf]">
            <p className="flex gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#d4af37]" />
              <span>
                Road No. 12, Banjara Hills<br />
                Hyderabad, Telangana 500034
              </span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone size={14} className="text-[#d4af37]" />
              <span>+91 90000 19980</span>
            </p>
            <div className="mt-2 flex items-center gap-3 border-t border-[#2d2d2d] pt-3 text-[11px]">
              <Link href="/account" className="text-[#a9a6a3] hover:text-white transition-colors">
                Customer Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2c2c2c] py-5">
        <div className="market-container flex flex-col items-center justify-between gap-2 text-[10px] text-[#777] sm:flex-row">
          <span>© {new Date().getFullYear()} Mahathi Tailor Shop. All rights reserved.</span>
          <span>Crafted in Hyderabad · Bespoke Elegance</span>
        </div>
      </div>
    </footer>
  );
}