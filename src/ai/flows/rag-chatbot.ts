'use server';

/**
 * @fileOverview A RAG (Retrieval-Augmented Generation) chatbot that answers questions based on documents.
 *
 * - answerQuestion - A function that takes a user's question and returns an AI-generated answer.
 * - RagQueryInput - The input type for the answerQuestion function.
 * - RagQueryOutput - The return type for the answerQuestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {googleAI, textEmbedding} from '@genkit-ai/google-genai';
import * as path from 'path';
import * as fs from 'fs';

// Define the schema for the chatbot input
export const RagQueryInputSchema = z.object({
  question: z.string().describe('The question to ask the chatbot.'),
});
export type RagQueryInput = z.infer<typeof RagQueryInputSchema>;

// Define the schema for the chatbot output
export const RagQueryOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer.'),
});
export type RagQueryOutput = z.infer<typeof RagQueryOutputSchema>;

// Define the document retriever using FAISS
/*
const docRetriever = defineRetriever(
  {
    name: 'empowers-retriever',
    configSchema: z.object({
      indexFile: z.string().optional(),
    }),
  },
  async (config) => {
    const documents = [];
    const docsDir = path.resolve(process.cwd(), 'src', 'docs', 'rag-data');

    if (fs.existsSync(docsDir)) {
        const files = fs.readdirSync(docsDir);
        for (const file of files) {
            if (file.endsWith('.txt')) {
                const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
                documents.push({
                    content,
                    metadata: { source: file }
                });
            }
        }
    }

    if (documents.length === 0) {
        documents.push({
            content: "There are currently no documents available to answer questions from. Please add some text files to the 'src/docs/rag-data' directory.",
            metadata: { source: 'system-placeholder' }
        });
    }

    // Initialize the FAISS retriever with our documents and embedding model
    return faissRetriever(
      {
        documents,
        embedder: textEmbedding('text-embedding-004'),
        indexFile: config.indexFile,
      }
    );
  }
);
*/
// Define the AI prompt for answering questions
const answerPrompt = ai.definePrompt({
  name: 'answerPrompt',
  input: {
    schema: z.object({
      question: z.string(),
    }),
  },
  output: {
    schema: z.object({
      answer: z.string(),
    }),
  },
  // Augment the prompt with context from our retriever
  // retrievers: [docRetriever],
  // Use a powerful model capable of following instructions
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are a helpful assistant for "The Empowers youth group".
    Your goal is to answer the user's question based *only* on the provided context.
    Do not use any external knowledge.
    If the context does not contain the answer, you MUST state: "I'm sorry, but I don't have enough information to answer that question. My knowledge is limited to the documents provided about The Empowers youth group."

    CONTEXT:
    {{#each docs}}
    - {{{content}}}
    {{/each}}

    QUESTION:
    {{{question}}}
    `,
});

// Define the main flow for our RAG chatbot
const ragChatFlow = ai.defineFlow(
  {
    name: 'ragChatFlow',
    inputSchema: RagQueryInputSchema,
    outputSchema: RagQueryOutputSchema,
  },
  async ({ question }) => {
    //
    return { answer: "The RAG chatbot is temporarily disabled due to a configuration issue. Please check back later." };
    /*
    const { output } = await answerPrompt({ question });
    return output!;
    */
  }
);

// Exported function that the UI will call
export async function answerQuestion(
  input: RagQueryInput
): Promise<RagQueryOutput> {
  return ragChatFlow(input);
}
