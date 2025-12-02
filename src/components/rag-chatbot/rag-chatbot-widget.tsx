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
import { RagChatbot } from './rag-chatbot';


export function RagChatbotWidget() {
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
           <DialogHeader className="p-4 border-b">
            <DialogTitle className="sr-only">Empowers Chatbot</DialogTitle>
            <DialogDescription className="sr-only">A chatbot to help you with questions about The Empowers youth group.</DialogDescription>
          </DialogHeader>
          <RagChatbot />
        </DialogContent>
      </Dialog>
    </>
  );
}
