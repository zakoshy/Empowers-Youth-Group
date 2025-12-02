'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SendHorizonal, Bot, User, Loader2 } from 'lucide-react';
import { TheEmpowersYouthGroupLogo } from '../icons';
import { answerQuestion, RagQueryInput, RagQueryOutput } from '@/ai/flows/rag-chatbot';
import ReactMarkdown from 'react-markdown';

type Message = {
  text: string;
  sender: 'user' | 'bot';
  isLoading?: boolean;
};

export function RagChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm the Empowers assistant. How can I help you today? You can ask me about the group's activities, mission, or how to join.",
      sender: 'bot',
    }
  ]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
              viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  };

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { text: input, sender: 'user' };
    const loadingMessage: Message = { text: '', sender: 'bot', isLoading: true };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    scrollToBottom();

    try {
      const response = await answerQuestion({ question: input });
      const botMessage: Message = { text: response.answer, sender: 'bot' };
      setMessages(prev => [...prev.slice(0, -1), botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        text: "I'm sorry, something went wrong. Please try again.",
        sender: 'bot',
      };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
        scrollToBottom();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-card">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center gap-3">
          <TheEmpowersYouthGroupLogo className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>Empowers Chatbot</CardTitle>
            <CardDescription>Your guide to our community</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'bot' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
              <div className={`rounded-lg px-3 py-2 max-w-[80%] ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.isLoading ? (
                  <div className="flex items-center gap-2 p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert prose-p:my-0 whitespace-pre-wrap break-words">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.sender === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background flex-shrink-0">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="pr-12"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute top-1/2 right-1.5 -translate-y-1/2 h-7 w-7"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
