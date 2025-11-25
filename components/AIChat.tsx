import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
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
    { id: '1', sender: 'ai', text: 'Hello! I am Nexus. How can I assist with your trading today?', timestamp: new Date() }
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

    // Pass the config to the service so the AI knows the user's status
    const response = await chatWithAssistant(userMsg.text, marketContext, config);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: response || "I couldn't process that request.",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-accent rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform z-40 group"
        >
          <MessageSquare className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-gray-900"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 md:w-96 h-[500px] bg-surface border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-gray-800/80 border-b border-gray-700 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Nexus Assistant</h3>
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white rounded-br-none' 
                      : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700 flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-700 bg-gray-800/30">
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about market trends..."
                className="w-full bg-gray-900 border border-gray-600 rounded-full py-2.5 pl-4 pr-10 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
              />
              <button 
                type="submit" 
                disabled={!inputText.trim()}
                className="absolute right-1.5 top-1.5 p-1.5 bg-primary rounded-full text-white hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
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