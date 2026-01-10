
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Terminal, Zap, Shield } from 'lucide-react';
import { chatWithAssistant } from '../services/geminiService';
import { BotConfig } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface AIChatProps {
  marketContext: string;
  config: BotConfig;
}

export const AIChat: React.FC<AIChatProps> = ({ marketContext, config }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Neural Node Online. Ready for instructions. Use commands like "Analyze XAU" or "Switch to Aggressive".', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const response = await chatWithAssistant(userMsg.text, marketContext, config);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: response || "System timeout.",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-3xl shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center hover:scale-110 transition-all z-40 group border border-white/20"
        >
          <Terminal className="w-8 h-8 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse border-2 border-[#070b14]"></span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-8 right-6 w-[calc(100vw-3rem)] sm:w-96 h-[600px] bg-[#0a101f] border border-gray-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden animate-fade-in">
          <div className="p-6 bg-gray-800/40 border-b border-gray-800 flex justify-between items-center backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm uppercase tracking-tighter">Command Center</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Neural Link Active</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20 scrollbar-hide">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-5 rounded-3xl text-xs font-bold leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white rounded-br-none shadow-xl shadow-primary/10' 
                      : 'bg-gray-900 text-gray-300 rounded-bl-none border border-gray-800 shadow-2xl'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-900 p-5 rounded-3xl rounded-bl-none border border-gray-800 flex gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-5 border-t border-gray-800 bg-black/40">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="EXECUTE COMMAND..."
                className="w-full bg-gray-900 border border-gray-800 rounded-2xl py-4 pl-6 pr-14 text-xs text-white font-mono placeholder:text-gray-700 outline-none focus:border-primary transition-all"
              />
              <button 
                type="submit" 
                disabled={!inputText.trim()}
                className="absolute right-2 top-2 p-2 bg-primary rounded-xl text-white hover:bg-blue-600 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
