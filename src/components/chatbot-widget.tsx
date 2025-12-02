
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MessageSquare } from 'lucide-react';

const CHATBOT_URL = 'https://rag-project-delta.vercel.app/';

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
        <DialogContent className="sm:max-w-md h-[70vh] flex flex-col p-0">
           <DialogHeader className="sr-only">
            <DialogTitle>Empowers Youth Group Chatbot</DialogTitle>
            <DialogDescription>
              An interactive chatbot to answer your questions about the Empowers youth group. You can ask about our mission, events, and how to join.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={CHATBOT_URL}
              className="w-full h-full border-0"
              title="Empowers Youth Group Chatbot"
              allow="microphone"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
