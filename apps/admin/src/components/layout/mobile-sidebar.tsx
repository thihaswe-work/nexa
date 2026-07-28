'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarContent } from '@/components/layout/sidebar';

export function MobileSidebar() {
  const { isSidebarOpen, setSidebarOpen } = useAuthStore();

  return (
    <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="p-0 w-72">
        <div className="flex h-14 items-center border-b px-6">
          <span className="text-xl font-bold">Nexa Admin</span>
        </div>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
