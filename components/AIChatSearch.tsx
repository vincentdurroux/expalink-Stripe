import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GoogleGenAI, Type } from "@google/genai";
import { SearchFilters } from '../types';

interface AIChatSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isSearching: boolean;
}

const AIChatSearch: React.FC<AIChatSearchProps> = ({ onSearch, isSearching }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const searchFunctionDeclaration = {
        name: "search_professionals",
        parameters: {
          type: Type.OBJECT,
          description: "Search for professionals in the directory based on profession, city, and language.",
          properties: {
            profession: {
              type: Type.STRING,
              description: "The type of professional (e.g., lawyer, plumber, accountant).",
            },
            city: {
              type: Type.STRING,
              description: "The city in Spain (e.g., Madrid, Barcelona, Valencia).",
            },
            language: {
              type: Type.STRING,
              description: "The language the professional should speak (e.g., French, English, Spanish).",
            },
          },
          required: ["profession", "city"],
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: "You are a helpful assistant for ExpaLink, a directory for expatriates in Spain. Your goal is to help users find professionals. If the user is looking for someone, use the search_professionals tool. If they don't provide a city, ask for it. If they don't provide a profession, ask for it. Be concise and friendly.",
          tools: [{ functionDeclarations: [searchFunctionDeclaration] }],
        },
      });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        const call = functionCalls[0];
        if (call.name === 'search_professionals') {
          const args = call.args as any;
          onSearch({
            profession: args.profession || '',
            city: args.city || '',
            language: args.language || '',
          });
          
          setMessages(prev => [...prev, { 
            role: 'ai', 
            content: t('expatHome.aiChat.foundResults') 
          }]);
          
          // Scroll to results anchor after a short delay to let results render
          setTimeout(() => {
            const anchor = document.getElementById('search-results-anchor');
            if (anchor) {
              anchor.scrollIntoView({ behavior: 'smooth' });
            }
          }, 500);
        }
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: response.text || t('expatHome.aiChat.error') }]);
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: t('expatHome.aiChat.error') }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[500px]">
      <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#45a081] to-[#2e75c2] rounded-xl flex items-center justify-center text-white shadow-lg">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t('expatHome.aiChat.title')}</h3>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{t('expatHome.aiChat.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
          <Sparkles size={12} className="animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">AI Powered</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
              <MessageSquare size={32} />
            </div>
            <p className="text-gray-400 font-medium">{t('expatHome.aiChat.placeholder')}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
              msg.role === 'user' 
                ? 'bg-black text-white rounded-tr-none' 
                : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 text-gray-400 p-4 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">{t('expatHome.aiChat.searching')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-50/50 border-t border-gray-50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('expatHome.aiChat.placeholder')}
            className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 pr-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#45a081]/20 focus:border-[#45a081] transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-90"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatSearch;
