"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  ArrowUpRight,
  Globe,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  HelpCircle,
  SquarePen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useThemeStore } from "@/lib/stores/theme";
import { useNetworkStore, type SuiNetwork } from "@/lib/stores/network";
import { useChatStore } from "@/lib/stores/chat";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface SuiPriceData {
  price: number;
  change24h: number;
}

export function AppNavbar() {
  const { setShowAuthModal } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { network, setNetwork } = useNetworkStore();
  const { clearMessages } = useChatStore();
  const [suiPrice, setSuiPrice] = useState<SuiPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewChatIcon, setShowNewChatIcon] = useState(false);

  const networks: { value: SuiNetwork; label: string; color: string }[] = [
    { value: "mainnet", label: "Mainnet", color: "text-green-500" },
    { value: "testnet", label: "Testnet", color: "text-yellow-500" },
    { value: "devnet", label: "Devnet", color: "text-blue-500" },
  ];

  const currentNetwork =
    networks.find((n) => n.value === network) || networks[0];

  useEffect(() => {
    const fetchSuiPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true",
        );
        const data = await response.json();
        if (data.sui) {
          setSuiPrice({
            price: data.sui.usd,
            change24h: data.sui.usd_24h_change,
          });
        }
      } catch (error) {
        console.error("Failed to fetch SUI price:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuiPrice();
    const interval = setInterval(fetchSuiPrice, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const handleSignIn = () => {
    setShowAuthModal(true);
  };

  const handleNewChat = () => {
    clearMessages();
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex py-2 items-center justify-between">
          {/* Logo with New Chat on Hover */}
          <div className="flex items-center gap-3">
            <div
              className="relative group cursor-pointer"
              onClick={handleNewChat}
              onMouseEnter={() => setShowNewChatIcon(true)}
              onMouseLeave={() => setShowNewChatIcon(false)}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-sui to-sui-dark rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:shadow-lg">
                <AnimatePresence mode="wait">
                  {showNewChatIcon ? (
                    <motion.div
                      key="new-chat"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SquarePen className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="logo"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-white font-bold text-lg"
                    >
                      S
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="hidden sm:block">
              <h1 className="font-semibold text-base leading-tight">
                SUIscan AI
              </h1>
              <p className="text-xs text-muted-foreground">
                Transaction Explainer
              </p>
            </div>

            {/* Center: Sui Price - Desktop */}
            <div className="hidden lg:flex items-center gap-2 px-4">
              <div className="w-4 h-4 bg-gradient-to-br from-sui to-sui-dark rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
              ) : suiPrice ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    ${suiPrice.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1">
                    {suiPrice.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span
                      className={cn(
                        "text-xs font-medium",
                        suiPrice.change24h >= 0
                          ? "text-green-500"
                          : "text-red-500",
                      )}
                    >
                      {suiPrice.change24h >= 0 ? "+" : ""}
                      {suiPrice.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">--</span>
              )}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Network Selector */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl hover:bg-accent transition-colors">
                  <Globe className={cn("w-4 h-4", currentNetwork.color)} />
                  <span className="text-sm font-medium">
                    {currentNetwork.label}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-popover border border-border rounded-lg p-1 shadow-lg z-50 min-w-[160px]"
                  align="end"
                  sideOffset={5}
                >
                  {networks.map((net) => (
                    <DropdownMenu.Item
                      key={net.value}
                      onClick={() => setNetwork(net.value)}
                      className={cn(
                        "flex items-center gap-3 px-2 py-1.5 text-sm rounded cursor-pointer outline-none",
                        "hover:bg-accent transition-colors",
                        network === net.value && "bg-accent",
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          net.color.replace("text-", "bg-"),
                        )}
                      />
                      <span className="flex-1">{net.label}</span>
                      {network === net.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center py-1.5 px-2 rounded-2xl hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-yellow-500" />
              ) : (
                <Moon className="w-4 h-4 text-blue-500" />
              )}
            </button>

            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors font-medium"
            >
              <span className="text-sm">Sign In</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            {/* Sign In Button - Mobile */}
            <button
              onClick={handleSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <span>Sign In</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            {/* Help Menu - Mobile */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="flex items-center justify-center w-9 h-9 rounded-2xl hover:bg-accent transition-colors"
                  aria-label="Help menu"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-popover border border-border rounded-lg p-1 shadow-lg z-50 min-w-[200px]"
                  align="end"
                  sideOffset={5}
                >
                  {/* Network Section */}
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Network
                  </div>
                  {networks.map((net) => (
                    <DropdownMenu.Item
                      key={net.value}
                      onClick={() => setNetwork(net.value)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer outline-none",
                        "hover:bg-accent transition-colors",
                        network === net.value && "bg-accent",
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          net.color.replace("text-", "bg-"),
                        )}
                      />
                      <span className="flex-1">{net.label}</span>
                      {network === net.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </DropdownMenu.Item>
                  ))}

                  <DropdownMenu.Separator className="h-px bg-border my-1" />

                  {/* Theme Section */}
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Appearance
                  </div>
                  <DropdownMenu.Item
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded cursor-pointer outline-none hover:bg-accent transition-colors"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-4 h-4 text-yellow-500" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-blue-500" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}