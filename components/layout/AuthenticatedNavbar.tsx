"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Globe, ChevronDown, LogOut, Settings as SettingsIcon, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useThemeStore } from "@/lib/stores/theme";
import { useNetworkStore, type SuiNetwork } from "@/lib/stores/network";
import { shortenAddress } from "@/lib/sui/client";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SettingsModal } from "./SettingsModal";

interface SuiPriceData {
  price: number;
  change24h: number;
}

export function AuthenticatedNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { network, setNetwork } = useNetworkStore();
  const [suiPrice, setSuiPrice] = useState<SuiPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const networks: { value: SuiNetwork; label: string; color: string }[] = [
    { value: "mainnet", label: "Mainnet", color: "text-green-500" },
    { value: "testnet", label: "Testnet", color: "text-yellow-500" },
    { value: "devnet", label: "Devnet", color: "text-blue-500" },
  ];

  const currentNetwork = networks.find((n) => n.value === network) || networks[0];

  useEffect(() => {
    const fetchSuiPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true"
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

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    logout();
  };

  return (
    <>
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 pt-1.5">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Center: Sui Price */}
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-3xl bg-secondary/50">
              <div className="w-5 h-5 bg-gradient-to-br from-sui to-sui-dark rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
              ) : suiPrice ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">${suiPrice.price.toFixed(2)}</span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      suiPrice.change24h >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {suiPrice.change24h >= 0 ? "+" : ""}
                    {suiPrice.change24h.toFixed(2)}%
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Price unavailable</span>
              )}
            </div>
          </div>

          {/* Right: Network + Theme + User */}
          <div className="flex items-center gap-2">
            {/* Network Selector - Desktop */}
            <div className="hidden md:block">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-secondary hover:bg-accent transition-colors">
                    <Globe className={cn("w-4 h-4", currentNetwork.color)} />
                    <span className="text-sm font-medium">{currentNetwork.label}</span>
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
                          "flex items-center gap-3 px-3 py-1.5 text-sm rounded cursor-pointer outline-none",
                          "hover:bg-accent transition-colors",
                          network === net.value && "bg-accent"
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            net.color.replace("text-", "bg-")
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
            </div>

            {/* Theme Toggle - Desktop */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-2xl bg-secondary hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-yellow-500" />
              ) : (
                <Moon className="w-4 h-4 text-blue-500" />
              )}
            </button>

            {/* User Menu */}
            {user && (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-1 px-2 py-1 rounded-3xl bg-accent/50 hover:bg-accent transition-colors">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-primary">
                          {shortenAddress(user.suiAddress).slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="bg-popover border border-border rounded-lg p-1 shadow-lg z-50 min-w-[220px]"
                    align="end"
                    sideOffset={5}
                  >
                    {/* User Info */}
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium truncate">
                        {user.name || shortenAddress(user.suiAddress)}
                      </p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.plan} Plan • {user.dailyUsage || 0} / {user.plan === "PRO" ? 1000 : 20} today
                      </p>
                    </div>

                    {/* Mobile-only options */}
                    <div className="md:hidden">
                      <DropdownMenu.Item
                        onClick={toggleTheme}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm rounded cursor-pointer outline-none hover:bg-accent transition-colors"
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

                      <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className="flex items-center gap-3 px-3 py-2.5 text-sm rounded cursor-pointer outline-none hover:bg-accent transition-colors">
                          <Globe className={cn("w-4 h-4", currentNetwork.color)} />
                          <span className="flex-1">{currentNetwork.label}</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.SubContent
                            className="bg-popover border border-border rounded-lg p-1 shadow-lg z-50 min-w-[160px]"
                            sideOffset={8}
                          >
                            {networks.map((net) => (
                              <DropdownMenu.Item
                                key={net.value}
                                onClick={() => setNetwork(net.value)}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 text-sm rounded cursor-pointer outline-none",
                                  "hover:bg-accent transition-colors",
                                  network === net.value && "bg-accent"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    net.color.replace("text-", "bg-")
                                  )}
                                />
                                <span className="flex-1">{net.label}</span>
                              </DropdownMenu.Item>
                            ))}
                          </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Sub>

                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    </div>

                    {/* Settings */}
                    <DropdownMenu.Item
                      onClick={() => setShowSettings(true)}
                      className="flex items-center gap-3 px-3 py-1.5 mt-1 text-sm rounded cursor-pointer outline-none hover:bg-accent transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span>Settings</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-border" />

                    {/* Logout */}
                    <DropdownMenu.Item
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-1.5 text-sm text-destructive rounded cursor-pointer outline-none hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
    
    <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
