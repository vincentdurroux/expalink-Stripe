
import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Shield, Lock, CheckCheck, Loader2, User, Globe } from 'lucide-react';
import { Professional } from '../types';
// Correcting useTranslation import to use react-i18next instead of deprecated LanguageContext
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'pro';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

interface MessagingSystemProps {
  professional: Professional;
  messages: Message[];
  onClose: () => void;
  onSendMessage: (text: string) => void;
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ professional, messages, onClose, onSendMessage }) => {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    // Simulation du délai réseau
    setTimeout(() => {
      onSendMessage(inputText);
      setInputText('');
      setIsSending(false);
    }, 600);
  };

  return (
    <div className="fixed bottom-8 right-8 w-full max-w-[400px] h-[600px] z-[200] flex flex-col bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-5 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={professional.image} alt={professional.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 leading-none mb-1">{professional.name}</h3>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                <Globe size={10} />
                {professional.professions[0]}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-widest w-fit">
          <Shield size={10} className="text-indigo-500" />
          {t('messaging.encrypted')}
        </div>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 opacity-40">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
              <Lock size={32} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">{t('messaging.empty')}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.sender === 'user' 
                ? 'bg-black text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                <p className="leading-relaxed">{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-tight ${msg.sender === 'user' ? 'text-gray-400' : 'text-gray-300'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.sender === 'user' && <CheckCheck size={12} className="text-blue-400" />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-5 bg-white border-t border-gray-100 shrink-0">
        <div className="relative flex items-center gap-3">
          <input 
            type="text" 
            placeholder={t('messaging.placeholder')}
            className="flex-1 bg-gray-50 border border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl px-5 py-4 text-sm outline-none transition-all placeholder:text-gray-400"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              !inputText.trim() || isSending 
              ? 'bg-gray-100 text-gray-300' 
              : 'bg-black text-white shadow-lg shadow-black/10 active:scale-95'
            }`}
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessagingSystem;
