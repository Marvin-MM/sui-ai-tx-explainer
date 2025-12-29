"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import * as Switch from "@radix-ui/react-switch";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion } from "framer-motion";
import {
  X,
  Settings,
  Wallet,
  Bell,
  CreditCard,
  User,
  Trash2,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { useThemeStore } from "@/lib/stores/theme";
import { useNetworkStore } from "@/lib/stores/network";
import { shortenAddress } from "@/lib/sui/client";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { network, setNetwork } = useNetworkStore();
  const [activeTab, setActiveTab] = useState("general");
  const [notifications, setNotifications] = useState({
    transactions: true,
    updates: false,
    marketing: false,
  });

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    logout();
    onOpenChange(false);
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "wallets", label: "Wallets", icon: Wallet },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "plan", label: "Plan & Usage", icon: CreditCard },
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] sm:w-[90vw] md:max-w-3xl max-h-[90vh] md:max-h-[85vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden h-full"
          >
            {/* Mobile Header with Title and Close */}
            <div className="md:hidden flex items-center justify-between p-3 bg-secondary/30">
              <Dialog.Title className="text-lg font-semibold">
                Settings
              </Dialog.Title>
              <Dialog.Close className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            {/* Mobile Horizontal Scrollable Tabs */}
            <div className="md:hidden border-b border-border bg-secondary/30">
              <div className="overflow-x-auto scrollbar-hide">
                <nav className="flex px-2 py-1.5 gap-1.5 min-w-max">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                        activeTab === tab.id
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent/50",
                      )}
                    >
                      <tab.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-48 bg-secondary/30 border-r border-border p-4 flex-shrink-0">
              <Dialog.Title className="text-lg font-semibold mb-4 px-2">
                Settings
              </Dialog.Title>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeTab === tab.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 text-muted-foreground",
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
              {/* Desktop Close Button */}
              <Dialog.Close className="hidden md:block absolute right-4 top-4 p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </Dialog.Close>

              <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
                <Tabs.Content value="general" className="space-y-6">
                  <h2 className="text-lg md:text-xl font-semibold">
                    General Settings
                  </h2>

                  <div className="space-y-4">
                    <div className="flex flex-row items-center justify-between gap-4 p-0">
                      <div className="flex-auto">
                        <p className="text-sm md:text-base font-medium">
                          Dark Mode
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Use dark theme
                        </p>
                      </div>
                      <Switch.Root
                        checked={theme === "dark"}
                        onCheckedChange={toggleTheme}
                        className="w-10 h-5 md:w-11 md:h-6 bg-secondary rounded-full relative data-[state=checked]:bg-primary flex-shrink-0"
                      >
                        <Switch.Thumb className="block w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5" />
                      </Switch.Root>
                    </div>

                    <div className="flex flex-row items-center justify-between gap-4">
                      <div className="flex-auto">
                        <p className="text-sm md:text-base font-medium">
                          Network
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          Sui network to use
                        </p>
                      </div>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium min-w-[130px] justify-between">
                            <div className="flex items-center gap-2">
                              <Globe
                                className={cn(
                                  "w-4 h-4",
                                  network === "mainnet" && "text-green-500",
                                  network === "testnet" && "text-yellow-500",
                                  network === "devnet" && "text-blue-500",
                                )}
                              />
                              <span className="capitalize">{network}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="bg-popover border border-border rounded-lg p-1 shadow-lg z-[60] min-w-[160px]"
                            align="end"
                            sideOffset={5}
                          >
                            <DropdownMenu.Item
                              onClick={() => setNetwork("mainnet")}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm rounded cursor-pointer outline-none",
                                "hover:bg-accent transition-colors",
                                network === "mainnet" && "bg-accent",
                              )}
                            >
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="flex-1">Mainnet</span>
                              {network === "mainnet" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => setNetwork("testnet")}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm rounded cursor-pointer outline-none",
                                "hover:bg-accent transition-colors",
                                network === "testnet" && "bg-accent",
                              )}
                            >
                              <div className="w-2 h-2 rounded-full bg-yellow-500" />
                              <span className="flex-1">Testnet</span>
                              {network === "testnet" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => setNetwork("devnet")}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm rounded cursor-pointer outline-none",
                                "hover:bg-accent transition-colors",
                                network === "devnet" && "bg-accent",
                              )}
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="flex-1">Devnet</span>
                              {network === "devnet" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              )}
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="wallets" className="space-y-6">
                  <h2 className="text-lg md:text-xl font-semibold">
                    Connected Wallets
                  </h2>

                  {user && (
                    <div className="space-y-3">
                      <div className="flex flex-row items-center justify-between gap-3 p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm md:text-base font-medium">
                              Primary Wallet
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground font-mono break-all">
                              {shortenAddress(user.suiAddress)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-lg w-fit">
                          Primary
                        </span>
                      </div>
                    </div>
                  )}

                  <button className="w-full py-2.5 border border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm sm:text-base">
                    + Add Another Wallet
                  </button>
                </Tabs.Content>

                <Tabs.Content value="notifications" className="space-y-6">
                  <h2 className="text-lg md:text-xl font-semibold">
                    Notification Preferences
                  </h2>

                  <div className="space-y-4">
                    {[
                      {
                        key: "transactions",
                        label: "Transaction Alerts",
                        desc: "Get notified when monitored wallets have new transactions",
                      },
                      {
                        key: "updates",
                        label: "Product Updates",
                        desc: "Receive updates about new features",
                      },
                      {
                        key: "marketing",
                        label: "Marketing",
                        desc: "Promotional emails and offers",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex flex-row items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <p className="text-sm md:text-base font-medium">
                            {item.label}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                        <Switch.Root
                          checked={
                            notifications[
                              item.key as keyof typeof notifications
                            ]
                          }
                          onCheckedChange={(checked) =>
                            setNotifications((prev) => ({
                              ...prev,
                              [item.key]: checked,
                            }))
                          }
                          className="w-10 h-5 md:w-11 md:h-6 bg-secondary rounded-full relative data-[state=checked]:bg-primary flex-shrink-0"
                        >
                          <Switch.Thumb className="block w-4 h-4 md:w-5 md:h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5" />
                        </Switch.Root>
                      </div>
                    ))}
                  </div>
                </Tabs.Content>

                <Tabs.Content value="plan" className="space-y-6">
                  <h2 className="text-lg md:text-xl font-semibold">
                    Plan & Usage
                  </h2>

                  <div className="p-4 sm:p-5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="flex flex-row items-center justify-between gap-3 mb-3">
                      <span className="font-medium text-sm sm:text-lg">
                        {user?.plan || "FREE"} Plan
                      </span>
                      {user?.plan !== "PRO" && (
                        <button className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors w-auto">
                          Upgrade to Pro
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Daily Usage
                        </span>
                        <span className="font-medium">
                          {user?.dailyUsage || 0} /{" "}
                          {user?.plan === "PRO" ? 1000 : 20}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              ((user?.dailyUsage || 0) /
                                (user?.plan === "PRO" ? 1000 : 20)) *
                                100,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Tabs.Content>

                <Tabs.Content value="account" className="space-y-6">
                  <h2 className="text-lg md:text-xl font-semibold">Account</h2>

                  {user && (
                    <div className="space-y-4">
                      <div className="p-4 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">
                          Sui Address
                        </p>
                        <p className="font-mono text-xs sm:text-sm break-all">
                          {user.suiAddress}
                        </p>
                      </div>

                      {user.email && (
                        <div className="p-4 bg-secondary/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Email
                          </p>
                          <p className="text-sm sm:text-base break-all">
                            {user.email}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full py-3 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors font-medium"
                      >
                        Sign Out
                      </button>

                      <button className="w-full py-3 border border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium">
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </button>
                    </div>
                  )}
                </Tabs.Content>
              </Tabs.Root>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
