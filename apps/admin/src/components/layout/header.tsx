'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { UserNav } from '@/components/layout/user-nav';
import { Menu, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header() {
  const { toggleSidebar } = useAuthStore();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card/50 backdrop-blur-sm px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border-muted bg-muted/50 pl-9 text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
