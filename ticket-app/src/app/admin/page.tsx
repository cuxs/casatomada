import { KeyRound, ListIcon, Plus, QrCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Panel" };

const SECTIONS = [
  {
    label: "Ventas",
    description: "Ver y gestionar todas las ventas registradas",
    icon: ListIcon,
    href: "/admin/sales",
  },
  {
    label: "Registrar compra",
    description: "Cargar una nueva venta y generar el QR de entrada",
    icon: Plus,
    href: "/admin/register-sale",
  },
  {
    label: "Validar QR",
    description: "Escanear y validar entradas en la puerta del evento",
    icon: QrCode,
    href: "/check-qr",
  },
  {
    label: "Validar palabra clave",
    description: "Validar entrada por código de animal sin QR",
    icon: KeyRound,
    href: "/check-word",
  },
];

export default function AdminPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Herramientas de administración para Casa Tomada
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map(({ label, description, icon: Icon, href }) => (
          <Link key={href} href={href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-center justify-center w-9 h-9 bg-gray-900 rounded-lg shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <CardTitle className="text-base">{label}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
