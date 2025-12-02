
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
import { googleAI, textEmbedding } from '@genkit-ai/google-genai';
import * as path from 'path';
import * as fs from 'fs';
import { defineRetriever, Retriever, Document } from 'genkit';
import { FaissStore } from 'faiss-node';


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

// Define a custom FAISS retriever using `defineRetriever`
const faissRetriever: Retriever = defineRetriever(
  {
    name: 'empowers-faiss-retriever',
  },
  async (input) => {
    const docsDir = path.resolve(process.cwd(), 'src', 'docs', 'rag-data');
    const documents: Document[] = [];

    if (fs.existsSync(docsDir)) {
      const files = fs.readdirSync(docsDir);
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const content = fs.readFileSync(path.join(docsDir, file), 'utf-8');
          documents.push(Document.fromText(content, { source: file }));
        }
      }
    }

    if (documents.length === 0) {
      documents.push(Document.fromText(
        "There are currently no documents available to answer questions from. Please add some text files to the 'src/docs/rag-data' directory.",
        { source: 'system-placeholder' }
      ));
    }
    
    const embedder = textEmbedding('text-embedding-004');

    // Create a FAISS store with the documents.
    const store = await FaissStore.fromDocuments(documents, embedder);
    
    // Retrieve the most relevant documents for the input query.
    const relevantDocs = await store.similaritySearch(input.text, 3);
    return { documents: relevantDocs };
  }
);


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
  retrievers: [faissRetriever],
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
    
    const { output } = await answerPrompt({ question });
    return output!;
    
  }
);

// Exported function that the UI will call
export async function answerQuestion(
  input: RagQueryInput
): Promise<RagQueryOutput> {
  return ragChatFlow(input);
}
