
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  SendHorizonal,
  Volume2,
  StopCircle,
  ArrowUp,
} from "lucide-react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useChatStore } from "@/lib/stores/chat";
import { useAuthStore } from "@/lib/stores/auth";
import { isValidSuiDigest, getGuestId, cn } from "@/lib/utils";

// Enhanced markdown components with better styling and mobile responsiveness
const MarkdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return !inline && match ? (
      <div className="relative group my-4 w-full overflow-hidden">
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-zinc-400" />
          )}
        </button>
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-xl !my-0"
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.813rem",
              maxWidth: "100%",
            }}
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      </div>
    ) : (
      <code
        className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-sm font-mono break-words"
        {...props}
      >
        {children}
      </code>
    );
  },
  p({ children }: any) {
    return <p className="mb-4 last:mb-0 leading-7 break-words">{children}</p>;
  },
  ul({ children }: any) {
    return <ul className="list-disc list-inside mb-4 space-y-2 pl-2">{children}</ul>;
  },
  ol({ children }: any) {
    return (
      <ol className="list-decimal list-inside mb-4 space-y-2 pl-2">{children}</ol>
    );
  },
  li({ children }: any) {
    return <li className="leading-7 break-words">{children}</li>;
  },
  h1({ children }: any) {
    return <h1 className="text-xl md:text-2xl font-bold mb-4 mt-6 break-words">{children}</h1>;
  },
  h2({ children }: any) {
    return <h2 className="text-lg md:text-xl font-bold mb-3 mt-5 break-words">{children}</h2>;
  },
  h3({ children }: any) {
    return <h3 className="text-base md:text-lg font-semibold mb-2 mt-4 break-words">{children}</h3>;
  },
  blockquote({ children }: any) {
    return (
      <blockquote className="border-l-4 border-primary/50 pl-3 md:pl-4 py-2 my-4 italic bg-secondary/30 rounded-r-lg break-words">
        {children}
      </blockquote>
    );
  },
  table({ children }: any) {
    return (
      <div className="overflow-x-auto my-4 -mx-2 md:mx-0">
        <table className="min-w-full divide-y divide-border">{children}</table>
      </div>
    );
  },
  th({ children }: any) {
    return (
      <th className="px-2 md:px-4 py-2 bg-secondary font-semibold text-left text-sm">
        {children}
      </th>
    );
  },
  td({ children }: any) {
    return <td className="px-2 md:px-4 py-2 border-t border-border text-sm break-words">{children}</td>;
  },
  a({ href, children }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline break-all"
      >
        {children}
      </a>
    );
  },
  // Handle long strings that might not have spaces (like transaction digests)
  pre({ children }: any) {
    return (
      <pre className="overflow-x-auto whitespace-pre-wrap break-words">
        {children}
      </pre>
    );
  },
};

interface MessageActionsProps {
  content: string;
  messageId: string;
  onRegenerate?: () => void;
  onListen: (content: string, id: string) => void;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  onStop: () => void;
}

const MessageActions = ({
  content,
  messageId,
  onRegenerate,
  onListen,
  isPlaying,
  isLoadingAudio,
  onStop,
}: MessageActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
        aria-label="Copy message"
        title="Copy"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Audio Button */}
      {isPlaying ? (
        <button
          onClick={onStop}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Stop speaking"
          title="Stop"
        >
          <StopCircle className="w-4 h-4 text-red-400 animate-pulse" />
        </button>
      ) : (
        <button
          onClick={() => onListen(content, messageId)}
          disabled={isLoadingAudio}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
          aria-label="Listen to response"
          title="Listen"
        >
          {isLoadingAudio ? (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          ) : (
            <Volume2 className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      )}

      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Regenerate response"
          title="Regenerate"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export function ChatInterface() {
  const { user, setShowAuthModal } = useAuthStore();
  const {
    currentChatId,
    setCurrentChat,
    setStreaming,
    audioCache,
    addAudioToCache,
    clearMessages
  } = useChatStore();

  const [txDigest, setTxDigest] = useState("");
  const [inputMode, setInputMode] = useState<"digest" | "chat">("digest");

  // Audio State
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setMessages,
    append,
    reload,
  } = useChat({
    api: "/api/chat",
    body: {
      chatId: currentChatId,
      txDigest: inputMode === "digest" ? txDigest : undefined,
      guestId: !user ? getGuestId() : undefined,
    },
    onResponse: (response) => {
      const chatId = response.headers.get("X-Chat-Id");
      if (chatId && chatId !== currentChatId) {
        setCurrentChat(chatId);
      }
      setStreaming(true);
    },
    onFinish: () => {
      setStreaming(false);
      setInputMode("chat");
    },
    onError: (error) => {
      setStreaming(false);
      if (error.message.includes("429")) {
        setShowAuthModal(true);
      }
    },
  });

  // Init Audio Ref
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => setPlayingMessageId(null);
    audioRef.current.onerror = () => {
      setPlayingMessageId(null);
      setLoadingAudioId(null);
      alert("Failed to play audio.");
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-scroll with smooth behavior
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset state when chat changes
  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
      setInputMode("digest");
      setTxDigest("");
      // Audio cleanup happens in store via clearChat(), but we stop playback here
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingMessageId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId]);

  // Auto-focus input when switching modes
  useEffect(() => {
    if (inputMode === "chat" && messages.length > 0) {
      chatInputRef.current?.focus();
    }
  }, [inputMode, messages.length]);

  const handleDigestSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!txDigest.trim() || !isValidSuiDigest(txDigest) || isLoading) return;

      // Clear audio cache on new conversation start
      clearMessages();

      append(
        {
          role: "user",
          content: `Please explain this transaction: ${txDigest}`,
        },
        {
          data: { txDigest },
        }
      );
    },
    [txDigest, isLoading, append, clearMessages],
  );

  const handleMessageSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      handleSubmit(e);
    },
    [input, isLoading, handleSubmit],
  );

  const handleRegenerate = useCallback(() => {
    reload();
  }, [reload]);

  // --- AUDIO LOGIC START ---
  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingMessageId(null);
    }
  };

  const handleListen = async (content: string, messageId: string) => {
    // 1. Check if already playing this message
    if (playingMessageId === messageId) {
      handleStopAudio();
      return;
    }

    // Stop any current audio
    handleStopAudio();
    setLoadingAudioId(messageId);

    // 2. Check Cache (Zustand)
    if (audioCache[messageId]) {
      if (audioRef.current) {
        audioRef.current.src = audioCache[messageId];
        audioRef.current.play();
        setPlayingMessageId(messageId);
        setLoadingAudioId(null);
      }
      return;
    }

    // 3. Check Limits (LocalStorage)
    // Limits: Guest (2), Free (5), Pro (20)
    const usageKey = `tts_usage_${new Date().toISOString().split("T")[0]}`; // Reset daily
    const currentUsage = parseInt(localStorage.getItem(usageKey) || "0");

    let limit = 2; // Guest
    if (user) {
      if (user.plan === "PRO") limit = 20;
      else limit = 5; // Free
    }

    if (currentUsage >= limit) {
      setLoadingAudioId(null);
      if (!user) {
        setShowAuthModal(true); // Prompt guest to login
      } else {
        // Simple alert for now, could be a toast
        alert(`Daily listening limit reached for your ${user.plan || "Free"} plan.`);
      }
      return;
    }

    // 4. Fetch Audio
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });

      if (!response.ok) throw new Error("Audio generation failed");

      // 5. Process Blob & Store
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      addAudioToCache(messageId, url);

      // Update Usage
      localStorage.setItem(usageKey, (currentUsage + 1).toString());

      // Play
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingMessageId(messageId);
      }
    } catch (err) {
      console.error(err);
      alert("Could not generate audio.");
    } finally {
      setLoadingAudioId(null);
    }
  };
  // --- AUDIO LOGIC END ---



  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 md:px-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col">
              {/* Centered content for md and lg screens */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 flex flex-col justify-center items-center text-center py-48"
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <p className="font-semibold text-base md:text-lg text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed px-4">
                    Paste any Sui transaction digest and I'll explain exactly
                    what happened in plain English.
                  </p>
                </motion.div>

                {/* Transaction Input - centered on md/lg, bottom on sm */}
                <motion.form
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  onSubmit={handleDigestSubmit}
                  className="w-full max-w-xl hidden md:block px-4"
                >
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={txDigest}
                      onChange={(e) => setTxDigest(e.target.value)}
                      placeholder="Paste transaction digest (e.g., 6FMh...)"
                      className="w-full px-6 py-5 bg-secondary backdrop-blur-sm rounded-xl text-base md:text-lg focus:outline-none focus:ring-1 focus:ring-primary/50 pr-14 transition-all border border-transparent hover:border-primary/20"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={
                        !txDigest.trim() ||
                        !isValidSuiDigest(txDigest) ||
                        isLoading
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <SendHorizonal className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {txDigest && !isValidSuiDigest(txDigest) && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive mt-2 text-left flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Please enter a valid Sui transaction digest
                    </motion.p>
                  )}
                </motion.form>

                {!user && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-muted-foreground mt-6 hidden md:block px-4"
                  >
                    Guests get 1 explanation + 1 follow-up.{" "}
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in for more
                    </button>
                  </motion.p>
                )}
              </motion.div>
            </div>
          ) : (
            <div className="py-6">
              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex gap-2 md:gap-4 mb-6 group",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div className={cn(
                      "flex flex-col min-w-0",
                      message.role === "user" ? "max-w-[90%] md:max-w-[85%]" : "w-full"
                    )}>
                      {message.role === "user" ? (
                        <div className="rounded-2xl px-4 md:px-5 py-3 md:py-4 shadow-sm overflow-hidden bg-primary text-primary-foreground">
                          <p className="leading-7 break-words overflow-wrap-anywhere">{message.content}</p>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={MarkdownComponents}
                            >
                              {message.content}
                            </ReactMarkdown>
                            {isLoading && index === messages.length - 1 && (
                              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                            )}
                          </div>
                          <MessageActions
                            content={message.content}
                            messageId={message.id}
                            onListen={handleListen}
                            onStop={handleStopAudio}
                            isPlaying={playingMessageId === message.id}
                            isLoadingAudio={loadingAudioId === message.id}
                            onRegenerate={
                              index === messages.length - 1 && !isLoading
                                ? handleRegenerate
                                : undefined
                            }
                          />
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-3 md:px-4 pb-2"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-3 p-3 md:p-4 bg-destructive/10 text-destructive rounded-xl text-xs md:text-sm border border-destructive/20">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span className="break-words">{error.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      {(messages.length > 0 || true) && (
        <div className="p-3 md:p-4 backdrop-blur-sm bg-background/80">
          <div className="max-w-3xl mx-auto">
            {messages.length > 0 ? (
              // Follow-up input
              <form onSubmit={handleMessageSubmit}>
                <div className="relative">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a follow-up question..."
                    className="w-full px-4 md:px-6 py-4 bg-secondary/50 backdrop-blur-sm rounded-full focus:outline-none focus:ring-0 focus:ring-primary/50 pr-12 md:pr-14 transition-all border border-transparent hover:border-primary/20 text-base"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-primary text-primary-foreground rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ArrowUp className="w-5 h-5 md:w-5 md:h-5" />
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Initial digest input for small screens
              <form onSubmit={handleDigestSubmit} className="md:hidden">
                <div className="relative">
                  <input
                    type="text"
                    value={txDigest}
                    onChange={(e) => setTxDigest(e.target.value)}
                    placeholder="Paste transaction digest..."
                    className="w-full px-4 py-4 bg-secondary/50 backdrop-blur-sm rounded-3xl text-base focus:outline-none focus:ring-0 focus:ring-primary/50 pr-12 transition-all border border-transparent hover:border-primary/20"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={
                      !txDigest.trim() ||
                      !isValidSuiDigest(txDigest) ||
                      isLoading
                    }
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-primary-foreground rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SendHorizonal className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {txDigest && !isValidSuiDigest(txDigest) && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive mt-2 text-left flex items-center gap-2"
                  >
                    <AlertCircle className="w-3 h-3" />
                    Please enter a valid Sui transaction digest
                  </motion.p>
                )}
              </form>
            )}

            {/* Footer */}
            <div className="text-center mt-3 md:mt-3 px-2">
              {!user ? (
                <p className="text-xs text-muted-foreground">
                  By messaging Suiscan AI, an AI Transaction Explainer, you
                  agree to our{" "}
                  <a
                    href="/terms"
                    className="hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms
                  </a>{" "}
                  and have read our{" "}
                  <a
                    href="/privacy"
                    className="hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Suiscan AI can make mistakes. Check important info.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}