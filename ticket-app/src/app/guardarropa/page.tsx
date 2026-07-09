import { PackageCheck, PackagePlus } from "lucide-react";
import Link from "next/link";

export default function GuardarropaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Guardarropa</h1>
        <p className="mt-1 text-gray-500 text-sm">
          Buscá el animal del ticket para guardar o retirar prendas
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/guardarropa/guardar"
          className="flex items-center gap-4 bg-gray-900 text-white rounded-2xl px-6 py-8 shadow-sm hover:bg-gray-700 transition-colors"
        >
          <PackagePlus className="h-8 w-8 shrink-0" />
          <span>
            <span className="block text-xl font-bold">Guardar</span>
            <span className="block text-sm text-gray-300">
              Registrar prendas que entran
            </span>
          </span>
        </Link>

        <Link
          href="/guardarropa/retirar"
          className="flex items-center gap-4 bg-white border border-gray-200 text-gray-900 rounded-2xl px-6 py-8 shadow-sm hover:bg-gray-100 transition-colors"
        >
          <PackageCheck className="h-8 w-8 shrink-0" />
          <span>
            <span className="block text-xl font-bold">Retirar</span>
            <span className="block text-sm text-gray-500">
              Entregar prendas guardadas
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
