'use client';

import Link from "next/link";
import { Brain, LayoutDashboard, Library, Play, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="hidden sm:inline">Coach AI</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/test-analysis" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors flex items-center gap-2">
              <Play size={16} /> Área de Testes
            </Link>
            <Link href="/dashboard/mentor" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors flex items-center gap-2">
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link href="/knowledge" className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors flex items-center gap-2">
              <Library size={16} /> Conhecimento
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-foreground/60 hover:text-primary transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-white/10 animate-fade-in">
          <div className="px-4 pt-2 pb-6 space-y-4">
            <Link 
              href="/test-analysis" 
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-foreground/60 hover:text-primary transition-colors flex items-center gap-3 py-2"
            >
              <Play size={20} /> Área de Testes
            </Link>
            <Link 
              href="/dashboard/mentor" 
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-foreground/60 hover:text-primary transition-colors flex items-center gap-3 py-2"
            >
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link 
              href="/knowledge" 
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-foreground/60 hover:text-primary transition-colors flex items-center gap-3 py-2"
            >
              <Library size={20} /> Conhecimento
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
