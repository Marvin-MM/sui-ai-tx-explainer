// import { create } from 'zustand';

// interface Message {
//   id: string;
//   role: 'user' | 'assistant' | 'system';
//   content: string;
//   txDigest?: string | null;
//   createdAt: Date;
// }

// interface Chat {
//   id: string;
//   title: string;
//   messages: Message[];
//   createdAt: Date;
//   updatedAt: Date;
// }

// interface ChatState {
//   chats: Chat[];
//   currentChatId: string | null;
//   messages: Message[];
//   isStreaming: boolean;
  
//   setChats: (chats: Chat[]) => void;
//   setCurrentChat: (chatId: string | null) => void;
//   addMessage: (message: Message) => void;
//   updateLastMessage: (content: string) => void;
//   setMessages: (messages: Message[]) => void;
//   setStreaming: (streaming: boolean) => void;
//   clearMessages: () => void;
//   fetchChats: () => Promise<void>;
//   fetchChatMessages: (chatId: string) => Promise<void>;
//   deleteChat: (chatId: string) => Promise<void>;
// }

// export const useChatStore = create<ChatState>((set, get) => ({
//   chats: [],
//   currentChatId: null,
//   messages: [],
//   isStreaming: false,

//   setChats: (chats) => set({ chats }),
  
//   setCurrentChat: (chatId) => set({ currentChatId: chatId }),
  
//   addMessage: (message) => set((state) => ({ 
//     messages: [...state.messages, message] 
//   })),
  
//   updateLastMessage: (content) => set((state) => {
//     const messages = [...state.messages];
//     if (messages.length > 0) {
//       messages[messages.length - 1] = {
//         ...messages[messages.length - 1],
//         content,
//       };
//     }
//     return { messages };
//   }),
  
//   setMessages: (messages) => set({ messages }),
  
//   setStreaming: (isStreaming) => set({ isStreaming }),
  
//   clearMessages: () => set({ messages: [], currentChatId: null }),

//   fetchChats: async () => {
//     try {
//       const res = await fetch('/api/chats');
//       const data = await res.json();
//       if (data.chats) {
//         set({ chats: data.chats });
//       }
//     } catch (e) {
//       console.error('Failed to fetch chats:', e);
//     }
//   },

//   fetchChatMessages: async (chatId) => {
//     try {
//       const res = await fetch(`/api/chats/${chatId}/messages`);
//       const data = await res.json();
//       if (data.chat) {
//         set({ 
//           currentChatId: chatId,
//           messages: data.chat.messages,
//         });
//       }
//     } catch (e) {
//       console.error('Failed to fetch messages:', e);
//     }
//   },

//   deleteChat: async (chatId) => {
//     try {
//       await fetch(`/api/chats?id=${chatId}`, { method: 'DELETE' });
//       set((state) => ({
//         chats: state.chats.filter(c => c.id !== chatId),
//         currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
//         messages: state.currentChatId === chatId ? [] : state.messages,
//       }));
//     } catch (e) {
//       console.error('Failed to delete chat:', e);
//     }
//   },
// }));

import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  txDigest?: string | null;
  createdAt: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  messages: Message[];
  isStreaming: boolean;
  audioCache: Record<string, string>; // Maps messageId -> Blob URL

  setChats: (chats: Chat[]) => void;
  setCurrentChat: (chatId: string | null) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setMessages: (messages: Message[]) => void;
  setStreaming: (streaming: boolean) => void;
  addAudioToCache: (messageId: string, url: string) => void;
  clearMessages: () => void;
  fetchChats: () => Promise<void>;
  fetchChatMessages: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: [],
  isStreaming: false,
  audioCache: {},

  setChats: (chats) => set({ chats }),

  setCurrentChat: (chatId) => set({ currentChatId: chatId }),

  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),

  updateLastMessage: (content) => set((state) => {
    const messages = [...state.messages];
    if (messages.length > 0) {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content,
      };
    }
    return { messages };
  }),

  setMessages: (messages) => set({ messages }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  // New action to store audio blobs
  addAudioToCache: (messageId, url) => 
    set((state) => ({ audioCache: { ...state.audioCache, [messageId]: url } })),

  // Updated to clear audio cache when chat is cleared
  clearMessages: () => set({ messages: [], currentChatId: null, audioCache: {} }),

  fetchChats: async () => {
    try {
      const res = await fetch('/api/chats');
      const data = await res.json();
      if (data.chats) {
        set({ chats: data.chats });
      }
    } catch (e) {
      console.error('Failed to fetch chats:', e);
    }
  },

  fetchChatMessages: async (chatId) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`);
      const data = await res.json();
      if (data.chat) {
        set({ 
          currentChatId: chatId,
          messages: data.chat.messages,
          audioCache: {}, // Reset audio cache when loading a new chat
        });
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  },

  deleteChat: async (chatId) => {
    try {
      await fetch(`/api/chats?id=${chatId}`, { method: 'DELETE' });
      set((state) => {
        const isCurrentChat = state.currentChatId === chatId;
        return {
          chats: state.chats.filter(c => c.id !== chatId),
          currentChatId: isCurrentChat ? null : state.currentChatId,
          messages: isCurrentChat ? [] : state.messages,
          audioCache: isCurrentChat ? {} : state.audioCache, // Clear audio if deleting current chat
        };
      });
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  },
}));