'use client';

import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="w-[350px] h-[500px] sm:w-[400px] sm:h-[600px] bg-card shadow-2xl rounded-lg overflow-hidden border">
          <iframe
            src="https://empowersyouthchatbot.vercel.app/"
            className="w-full h-full border-0"
            title="Empowers Chatbot"
            allow="microphone"
          />
        </div>
      </div>

      {/* Toggle Button */}
      <div className="absolute bottom-0 right-0">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full h-16 w-16 shadow-lg"
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          style={{backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))'}}
        >
          {isOpen ? (
            <X className="h-8 w-8" />
          ) : (
            <MessageCircle className="h-8 w-8" />
          )}
        </Button>
      </div>
    </div>
  );
}
