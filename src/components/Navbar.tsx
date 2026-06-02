'use client';

import Link from "next/link";
import { Brain, LayoutDashboard, Library, Play, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/test-analysis", label: "Área de Testes", icon: Play },
    { href: "/dashboard/mentor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/knowledge", label: "Conhecimento", icon: Library },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-border" style={{ boxShadow: '0 1px 3px 0 rgba(60,64,67,.15)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline text-lg font-semibold text-foreground tracking-tight">Coach AI</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-light text-primary'
                      : 'text-muted hover:bg-gray-100 hover:text-foreground'
                  }`}
                >
                  <Icon size={16} /> {label}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-muted hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-border">
          <div className="px-4 py-3 space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:bg-gray-100 hover:text-foreground transition-colors"
              >
                <Icon size={18} /> {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
