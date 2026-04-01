import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-8 px-6 border-t border-slate-200 dark:border-zinc-800 transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="text-sm font-semibold text-foreground">
            Bradley Admin Dashboard
          </p>
          <p className="text-xs text-foreground/60">
            Enterprise Solution for Modern Businesses.
          </p>
        </div>
        
        <div className="flex items-center gap-8">
          <a href="#" className="text-xs font-semibold text-foreground/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wider">Help Center</a>
          <a href="#" className="text-xs font-semibold text-foreground/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wider">Privacy</a>
          <a href="#" className="text-xs font-semibold text-foreground/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wider">Terms</a>
        </div>
        
        <p className="text-xs font-medium text-foreground/40">
          © {new Date().getFullYear()} Bradley Web. Built with Next.js.
        </p>
      </div>
    </footer>
  );
}
