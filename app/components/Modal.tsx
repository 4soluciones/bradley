"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({ isOpen, onClose, title, children, width = "max-w-4xl" }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative w-full ${width} max-h-[90vh] overflow-hidden bg-card border border-border rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
          <h3 className="text-xl font-bold text-foreground tracking-tight">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl border border-border hover:bg-foreground/5 transition-colors group"
          >
            <X className="w-5 h-5 text-foreground/40 group-hover:text-foreground transition-colors" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
