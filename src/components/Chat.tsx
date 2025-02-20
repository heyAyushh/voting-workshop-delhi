'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Message } from './Message';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wallet = useWallet();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          wallet: wallet.publicKey?.toBase58(),
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
      };
      setMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-circle btn-primary fixed bottom-8 right-8 z-50 shadow-lg"
      >
        {isOpen ? '×' : '?'}
      </button>

      <div
        className={`fixed bottom-24 right-8 w-96 transform transition-all duration-300 ${
          isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        } z-40`}
      >
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body p-0">
            <div className="scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent h-[400px] space-y-4 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="text-center text-base-content/60">
                  Ask me anything about the voting dApp!
                </div>
              )}
              {messages.map((message, index) => (
                <Message key={index} role={message.role} content={message.content} />
              ))}
              {isLoading && (
                <div className="flex items-center justify-center space-x-2">
                  <span className="loading loading-dots loading-sm"></span>
                  <div className="text-base-content/60">Thinking...</div>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit} className="border-t border-base-300 bg-base-200 p-4">
              <div className="join w-full shadow-sm">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about voting or Solana..."
                  className="input join-item w-full border-base-300 bg-base-100"
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading} className="btn btn-primary join-item">
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
