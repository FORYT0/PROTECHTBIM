import { create } from 'zustand';

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

interface AIStore {
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  toggleAIBrain: () => void;
  openAIBrain: () => void;
  closeAIBrain: () => void;
  addMessage: (message: ChatMessage) => void;
  setTyping: (isTyping: boolean) => void;
  clearHistory: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
  isOpen: false,
  messages: [],
  isTyping: false,
  
  toggleAIBrain: () => set((state) => ({ isOpen: !state.isOpen })),
  openAIBrain: () => set({ isOpen: true }),
  closeAIBrain: () => set({ isOpen: false }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setTyping: (isTyping) => set({ isTyping }),
  
  clearHistory: () => set({ messages: [] }),
}));
