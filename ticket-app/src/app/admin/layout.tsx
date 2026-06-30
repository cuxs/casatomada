import { Menu } from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminNav from "./_components/admin-nav";

export const metadata: Metadata = {
  title: {
    template: "%s — Admin · Casa Tomada",
    default: "Admin — Casa Tomada",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 shrink-0 sticky top-0 h-screen">
        <AdminNav />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-gray-200 bg-white sticky top-0 z-40">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <AdminNav />
            </SheetContent>
          </Sheet>
          <span className="font-epilogue font-bold text-gray-900 text-sm tracking-tight">
            Casa Tomada · Admin
          </span>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
