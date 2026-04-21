"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface Option {
  id: string | number;
  label: string;
}

interface AutocompleteProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  error?: boolean;
  required?: boolean;
  hideLabel?: boolean;
  disabled?: boolean;
  isGrid?: boolean;
  /** Compact mode for tighter layouts */
  compact?: boolean;
  /** Dark mode for backgrounds like headers/footers */
  dark?: boolean;
  /** Mínimo de caracteres para mostrar resultados (ej: 3 = buscar al escribir 3+ letras) */
  minSearchLength?: number;
}

export default function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  label,
  icon,
  error,
  required,
  hideLabel,
  disabled,
  isGrid,
  compact,
  dark,
  minSearchLength = 0
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const updateDropdownPosition = () => {
    if (inputRef.current && typeof document !== "undefined") {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen && isGrid) updateDropdownPosition();
  }, [isOpen, searchTerm, isGrid]);

  const selectedOption = useMemo(() => 
    options.find((opt) => String(opt.id) === String(value)),
    [value, options]
  );

  // Solo sincronizar searchTerm cuando el input NO tiene foco (usuario no está escribiendo)
  useEffect(() => {
    const isFocused = typeof document !== 'undefined' && document.activeElement === inputRef.current;
    if (!isFocused) {
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      } else if (!value || value === "") {
        setSearchTerm("");
      }
    }
  }, [value, selectedOption, isOpen]);

  const filteredOptions = useMemo(() => 
    options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [options, searchTerm]
  );

  const canSelectOptions = minSearchLength === 0 || searchTerm.trim().length >= minSearchLength;
  const selectableOptions = canSelectOptions ? filteredOptions : [];

  // Reset highlighted index cuando cambian las opciones
  useEffect(() => {
    if (canSelectOptions && filteredOptions.length > 0) {
      setHighlightedIndex(0);
    } else {
      setHighlightedIndex(-1);
    }
  }, [searchTerm, canSelectOptions, filteredOptions.length]);

  // Scroll para mantener la opción destacada visible
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inContainer && !inDropdown) {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (selectedOption) {
          setSearchTerm(selectedOption.label);
        } else {
          setSearchTerm("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption]);

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setSearchTerm(option.label);
    setHighlightedIndex(-1);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    if (!isOpen) setIsOpen(true);
    if (newVal === "") {
      onChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || selectableOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => (i < selectableOptions.length - 1 ? i + 1 : i));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && selectableOptions[highlightedIndex]) {
          handleSelect(selectableOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const inputClasses = useMemo(() => {
    if (isGrid) {
      return `w-full h-full pl-11 pr-10 py-1 bg-transparent border-none text-[11px] font-black focus:bg-background focus:ring-0 outline-none rounded-none text-foreground transition-all`;
    }
    
    const base = "w-full focus:ring-4 focus:ring-orange-600/10 focus:border-orange-600 transition-all select-all outline-none";
    const padding = compact ? "pl-9 pr-8 h-9" : "pl-11 pr-10 py-3.5";
    const rounded = compact ? "rounded-lg" : "rounded-2xl";
    const text = compact ? "text-[11px] font-black uppercase" : "text-[12px] font-bold";
    
    let border = dark ? "border-slate-600" : "border-border";
    if (error) {
      border = "border-red-500 ring-2 ring-red-500/20";
    }
    
    const bg = dark ? `bg-slate-900 ${border} text-white` : `bg-foreground/[0.02] border ${border} text-foreground`;
    
    return `${base} ${padding} ${rounded} ${text} ${bg}`;
  }, [isGrid, compact, dark, error]);

  return (
    <div 
      className={`relative inline-block w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`} 
      ref={containerRef}
    >
      {label && !hideLabel && (
        <label className={`block mb-1.5 font-black uppercase tracking-widest ml-1 ${compact ? 'text-[9px] text-slate-400' : 'text-[10px] text-foreground/40'}`}>
          {label} {required && <span className="text-orange-600">*</span>}
        </label>
      )}
      
      <div className="relative group">
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none group-focus-within:text-orange-600 z-10 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}>
          {icon || <Search className="w-full h-full" />}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true);
            if (isGrid) setTimeout(() => updateDropdownPosition(), 0);
          }}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          className={inputClasses}
        />

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 transition-opacity duration-300 pointer-events-none [&>button]:pointer-events-auto">
          {searchTerm && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchTerm("");
                onChange("");
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-foreground/10 rounded-full text-foreground/30 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown 
            className={`w-3.5 h-3.5 text-foreground/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>

        {/* Dropdown Menu - Portal cuando isGrid para evitar que overflow del padre lo recorte */}
        {isOpen && (() => {
          const dropdownBody = (
            <div
              ref={dropdownRef}
              className="bg-card border border-border rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
              style={isGrid && typeof document !== "undefined" ? {
                position: "fixed",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: Math.max(dropdownPosition.width, 280),
                zIndex: 9999,
                minWidth: 280
              } : undefined}
            >
              {minSearchLength > 0 && searchTerm.trim().length < minSearchLength ? (
                <div className="p-8 text-center">
                  <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">
                    Escriba al menos {minSearchLength} caracteres para buscar
                  </p>
                </div>
              ) : filteredOptions.length > 0 ? (
                <div className="p-1.5">
                  {filteredOptions.map((option, index) => {
                    const isSelected = String(value) === String(option.id);
                    const isHighlighted = index === highlightedIndex;
                    return (
                      <button
                        key={option.id}
                        ref={(el) => { optionRefs.current[index] = el; }}
                        type="button"
                        onClick={() => handleSelect(option)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all ${
                          isSelected
                            ? 'bg-orange-600 text-white'
                            : isHighlighted
                              ? 'bg-orange-600/20 text-orange-600'
                              : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">Sin resultados</p>
                </div>
              )}
            </div>
          );
          if (isGrid && typeof document !== "undefined") {
            if (dropdownPosition.width > 0) {
              return createPortal(dropdownBody, document.body);
            }
            return null; // Esperar a tener posición antes de mostrar
          }
          return (
            <div className="absolute z-[100] w-full mt-2">
              {dropdownBody}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
