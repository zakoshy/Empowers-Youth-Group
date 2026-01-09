'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageSquare } from 'lucide-react';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
              onClick={() => setIsOpen(true)}
              aria-label="Open chatbot"
              style={{backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'}}
            >
              <MessageSquare className="h-8 w-8" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Empowers chatbot</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b sr-only">
            <DialogTitle>Empowers Chatbot</DialogTitle>
            <DialogDescription>
              A chatbot to help you with questions about The Empowers youth group.
            </DialogDescription>
          </DialogHeader>
          <iframe
            src="https://empowersyouthchatbot.vercel.app/"
            className="w-full h-full border-0"
            title="Empowers Chatbot"
          ></iframe>
        </DialogContent>
      </Dialog>
    </>
  );
}
