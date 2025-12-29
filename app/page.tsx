"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AuthenticatedNavbar } from "@/components/layout/AuthenticatedNavbar";
import { AuthModal } from "@/components/layout/AuthModal";
import { ChatInterface } from "@/components/features/ChatInterface";
import { useAuthStore } from "@/lib/stores/auth";
import { useThemeStore } from "@/lib/stores/theme";

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, checkSession, showAuthModal, setShowAuthModal } =
    useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkSession();

    // Apply initial theme
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [checkSession, theme, setTheme]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <>
      <div className="flex h-screen bg-background overflow-hidden">
        {user ? (
          <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <div className="hidden lg:block">
              <AppSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>

            {/* Mobile Sidebar Drawer */}
            <AnimatePresence>
              {mobileSidebarOpen && (
                <>
                  {/* Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  />

                  {/* Mobile Drawer */}
                  <motion.div
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    exit={{ x: -280 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="lg:hidden fixed left-0 top-0 bottom-0 z-50"
                  >
                    <AppSidebar
                      collapsed={false}
                      onToggle={() => {}}
                      mobileOpen={mobileSidebarOpen}
                      onMobileClose={() => setMobileSidebarOpen(false)}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Content for Authenticated Users */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* Authenticated Navbar */}
              <AuthenticatedNavbar
                onMenuClick={() => setMobileSidebarOpen(true)}
              />

              {/* Chat Interface */}
              <div className="flex-1 overflow-hidden">
                <ChatInterface />
              </div>
            </main>
          </>
        ) : (
          <>
            {/* Navbar and Content for Unauthenticated Users */}
            <div className="flex flex-col w-full">
              <AppNavbar />
              <main className="flex-1 overflow-hidden">
                <ChatInterface />
              </main>
            </div>
          </>
        )}
      </div>

      {/* Global Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
