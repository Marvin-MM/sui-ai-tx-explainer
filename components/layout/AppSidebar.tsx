"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus,
  Search,
  History,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MoreHorizontal,
  Sun,
  Moon,
  Globe,
  SquarePen,
} from "lucide-react";
import { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore } from "@/lib/stores/auth";
import { useChatStore } from "@/lib/stores/chat";
import { useThemeStore } from "@/lib/stores/theme";
import { useNetworkStore, type SuiNetwork } from "@/lib/stores/network";
import { SettingsModal } from "./SettingsModal";
import { shortenAddress } from "@/lib/sui/client";
import { formatDate, cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen = true,
  onMobileClose,
}: AppSidebarProps) {
  const { user } = useAuthStore();
  const {
    chats,
    currentChatId,
    clearMessages,
    fetchChats,
    fetchChatMessages,
    deleteChat,
  } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleNewChat = () => {
    clearMessages();
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleSelectChat = (chatId: string) => {
    if (chatId !== currentChatId) {
      fetchChatMessages(chatId);
    }
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 58 : 250 }}
        className="h-screen bg-card flex flex-col relative"
      >
        {/* Toggle Button - Hidden on mobile */}
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-secondary border border-border rounded-full items-center justify-center hover:bg-accent transition-colors z-50"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Logo */}
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sui to-sui-dark rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-semibold text-lg"
                >
                  SUIscan AI
                  <p className="text-xs font-normal">Transaction Explainer</p>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-2.5">
          <button
            onClick={handleNewChat}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-secondary transition-colors",
              collapsed && "justify-center px-0",
            )}
          >
            <SquarePen className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">New Chat</span>}
          </button>
        </div>

        {/* Search */}
        {!collapsed && user && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3">
          {user ? (
            <>
              {!collapsed && (
                <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
                  <History className="w-4 h-4" />
                  <span>Recent Chats</span>
                </div>
              )}
              <div className="space-y-1">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-colors",
                      currentChatId === chat.id
                        ? "bg-accent"
                        : "hover:bg-accent/50",
                    )}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    {collapsed ? (
                      <MessageSquarePlus className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {chat.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(chat.updatedAt)}
                          </p>
                        </div>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button
                              className="opacity-0 group-hover:opacity-100 p-1 border-none hover:bg-secondary rounded transition-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content className="bg-popover border border-border rounded-lg p-1 shadow-lg z-50">
                              <DropdownMenu.Item
                                className="flex items-center gap-2 px-2.5 py-1 text-sm text-destructive hover:bg-destructive/15 rounded cursor-pointer"
                                onClick={() => deleteChat(chat.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            !collapsed && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <p>Sign in to save your chat history</p>
              </div>
            )
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-2.5 space-y-1">
          {/* User Profile */}
          {user && (
            <div className="border-t border-border">
              <div
                onClick={() => setShowSettings(true)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 mt-1 rounded-lg hover:bg-accent cursor-pointer transition-colors",
                  collapsed && "justify-center px-0",
                )}
              >
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {shortenAddress(user.suiAddress).slice(0, 3)}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name || shortenAddress(user.suiAddress)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.plan} Plan
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}
