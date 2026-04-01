'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ThemeProvider } from "./ThemeProvider";
import { ApolloWrapper } from "./ApolloWrapper";
import { ToastProvider } from "./ToastContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/' || pathname === '/login';
  const isPureDisplayPage = pathname.startsWith('/modules/sales/display');

  if (isLoginPage || isPureDisplayPage) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme={isPureDisplayPage ? 'light' : 'dark'}
        enableSystem={false}
        disableTransitionOnChange
      >
        <ToastProvider>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
        </ToastProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ToastProvider>
        <ApolloWrapper>
          <div className="flex h-screen bg-background transition-colors duration-300 overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
              {/* Navbar */}
              <Navbar />

              {/* Main scrollable area */}
              <main className="flex-1 overflow-y-auto pt-16 sm:pl-64 flex flex-col">
                <div className="p-4 sm:p-6 lg:p-8 flex-1">
                  <div className="min-h-[calc(100vh-64px-180px)]">
                    {children}
                  </div>
                </div>
                
                <Footer />
              </main>
            </div>
          </div>
        </ApolloWrapper>
      </ToastProvider>
    </ThemeProvider>
  );
}
