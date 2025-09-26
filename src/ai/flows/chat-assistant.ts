
'use server';
/**
 * @fileOverview A chat assistant for the EmpowerHub youth group.
 *
 * This file defines a Genkit flow that acts as a conversational AI assistant.
 * It uses tools to fetch real-time information about a user's contributions,
 * upcoming events, and active polls to answer member questions.
 *
 * - chat - The main exported function to interact with the chat flow.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  collection,
  query,
  where,
  getDocs,
  getFirestore,
} from 'firebase/firestore';
import { FINANCIAL_CONFIG, events, polls, constitution } from '@/lib/data';

// Define schemas for tool inputs and outputs
const ContributionSummarySchema = z.object({
  totalMonthly: z.number(),
  totalSpecial: z.number(),
  outstandingDebt: z.number(),
});

const EventSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  location: z.string(),
  description: z.string(),
});

const PollSchema = z.object({
  id: z.string(),
  question: z.string(),
  voted: z.boolean(),
});

// Tool to get a user's contribution summary
const getContributionSummary = ai.defineTool(
  {
    name: 'getContributionSummary',
    description: "Get the current user's financial contribution summary for the current year.",
    inputSchema: z.object({
      userId: z.string().describe('The ID of the user to fetch data for.'),
    }),
    outputSchema: ContributionSummarySchema,
  },
  async ({ userId }) => {
    const firestore = getFirestore();
    const currentYear = new Date().getFullYear();
    const annualTarget = FINANCIAL_CONFIG.MONTHLY_CONTRIBUTION * 12;

    const contributionsRef = collection(
      firestore,
      'userProfiles',
      userId,
      'contributions'
    );
    const specialContributionsRef = collection(
      firestore,
      'userProfiles',
      userId,
      'specialContributions'
    );

    const contQuery = query(contributionsRef, where('year', '==', currentYear));
    const specialContQuery = query(specialContributionsRef, where('year', '==', currentYear));

    const contSnapshot = await getDocs(contQuery);
    const specialContSnapshot = await getDocs(specialContQuery);

    const totalMonthly = contSnapshot.docs.reduce(
      (sum, doc) => sum + doc.data().amount,
      0
    );
    const totalSpecial = specialContSnapshot.docs.reduce(
      (sum, doc) => sum + doc.data().amount,
      0
    );
    const outstandingDebt = annualTarget - totalMonthly;

    return { totalMonthly, totalSpecial, outstandingDebt };
  }
);

// Tool to get upcoming events
const getUpcomingEvents = ai.defineTool(
  {
    name: 'getUpcomingEvents',
    description: 'Get a list of all upcoming events for the group.',
    inputSchema: z.object({}),
    outputSchema: z.array(EventSchema),
  },
  async () => {
    // In a real app, this would fetch from Firestore. We use static data for now.
    return events.map(event => ({...event, image: ''}));
  }
);

// Tool to get active polls
const getActivePolls = ai.defineTool(
  {
    name: 'getActivePolls',
    description: 'Get a list of currently active polls that the user has not voted on yet.',
    inputSchema: z.object({}),
    outputSchema: z.array(PollSchema),
  },
  async () => {
     // In a real app, this would fetch from Firestore. We use static data for now.
    return polls.filter(p => !p.voted);
  }
);

// Tool to get constitution info
const getConstitutionInfo = ai.defineTool(
    {
      name: 'getConstitutionInfo',
      description: 'Get information about the group constitution, like its URL and last update date.',
      inputSchema: z.object({}),
      outputSchema: z.object({ url: z.string(), lastUpdated: z.string() }),
    },
    async () => {
      return constitution;
    }
  );


// Define schemas for the main chat flow
export const ChatInputSchema = z.object({
  userId: z.string(),
  message: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  message: z.string(),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Define the main prompt and flow
const chatAssistantPrompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  system: `You are a friendly and helpful AI assistant for the "The Empowers youth group".
Your goal is to answer member questions accurately and concisely.
- Use the available tools to fetch real-time data.
- If you don't know the answer, say that you don't have that information.
- Keep your answers brief and to the point.
- When asked about contributions, always provide the numbers.
- Your persona is supportive and encouraging.`,
  tools: [getContributionSummary, getUpcomingEvents, getActivePolls, getConstitutionInfo],
  output: { schema: ChatOutputSchema },
});

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await chatAssistantPrompt({
      prompt: input.message,
      context: [
          {
            role: 'user',
            content: `My user ID is ${input.userId}. Please use this ID when fetching my data.`,
          }
      ],
    });
    return output?.message ?? "I'm sorry, I couldn't process that request.";
  }
);

// Exported function to be called from the UI
export async function chat(input: ChatInput): Promise<string> {
  return await chatAssistantFlow(input);
}
