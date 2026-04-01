"use client";

import React from "react";
import { Search } from "lucide-react";

interface ProductFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export default function ProductFilter({ searchTerm, setSearchTerm }: ProductFilterProps) {
  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-foreground/40" />
      </div>
      <input
        type="text"
        placeholder="Buscar productos por nombre o código..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full py-2 pl-10 pr-4 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-orange-600 transition-colors shadow-sm"
      />
    </div>
  );
}
