"use client";

import {
  Car,
  KeyRound,
  LayoutDashboard,
  ListIcon,
  Plus,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Panel", icon: LayoutDashboard, href: "/admin", exact: true },
  { label: "Ventas", icon: ListIcon, href: "/admin/sales", exact: false },
  {
    label: "Registrar compra",
    icon: Plus,
    href: "/admin/register-sale",
    exact: false,
  },
  {
    label: "Viajes compartidos",
    icon: Car,
    href: "/admin/ride-posts",
    exact: false,
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="flex flex-col h-full py-6 px-3">
      <div className="px-2 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Casa Tomada
        </p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">Admin</p>
      </div>

      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map(({ label, icon: Icon, href, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(href, exact)
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}

        <Separator className="my-2" />

        <a
          href="/check-qr"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <QrCode className="h-4 w-4 shrink-0" />
          Validar QR
        </a>

        <a
          href="/check-word"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          Validar palabra clave
        </a>
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100">
        <a
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50"
        >
          ← Volver al sitio
        </a>
      </div>
    </div>
  );
}
