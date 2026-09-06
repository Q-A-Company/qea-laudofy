import { Building2, LogOut, Menu, Users, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Imóveis", icon: Building2, adminOnly: false },
  { to: "/admin/users", label: "Corretores", icon: Users, adminOnly: true },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useAuth();
  const location = useLocation();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.filter((item) => !item.adminOnly || profile?.role === "admin").map((item) => {
        const active =
          location.pathname === item.to || location.pathname.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-accent-500/12 text-accent-300"
                : "text-text-muted hover:bg-surface-raised hover:text-text"
            }`}
          >
            <Icon className="size-[18px]" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard() {
  const { profile, signOut } = useAuth();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-xs font-semibold text-accent-300">
        {profile?.name?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{profile?.name}</p>
        <p className="truncate text-xs text-text-muted">
          {profile?.role === "admin" ? "Administrador" : "Corretor"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => signOut()}
        title="Sair"
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-faint transition-colors hover:bg-surface-hover hover:text-text"
      >
        <LogOut className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function BrandMark() {
  return (
    <div>
      <p className="text-[15px] font-semibold tracking-tight text-text">Q&amp;A Laudofy</p>
      <p className="text-xs text-text-faint">Uma solução da Q&amp;A Company</p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg md:flex">
      {/* Sidebar - desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-bg-inset p-4 md:flex">
        <div className="mb-6 px-1">
          <BrandMark />
        </div>
        <div className="flex-1">
          <NavLinks />
        </div>
        <UserCard />
      </aside>

      {/* Top bar - mobile */}
      <header className="flex items-center justify-between border-b border-border bg-bg-inset px-4 py-3 md:hidden">
        <BrandMark />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex size-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-raised"
        >
          <Menu className="size-5" strokeWidth={2} />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-72 max-w-[85vw] flex-col border-r border-border bg-bg-inset p-4 flex">
            <div className="mb-6 flex items-center justify-between px-1">
              <BrandMark />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-raised"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <UserCard />
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="flex-1 bg-black/60"
          />
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
