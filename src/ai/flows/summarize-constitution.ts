
'use server';

/**
 * @fileOverview Provides an AI-powered summarization for the group constitution.
 *
 * - summarizeConstitution - A function that returns a summary of the constitution.
 * - SummarizeConstitutionInput - The input type for the summarizeConstitution function.
 * - SummarizeConstitutionOutput - The return type for the summarizeConstitution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { extractTextFromPdf } from '@/lib/pdf-utils';

const SummarizeConstitutionInputSchema = z.object({
  constitutionUrl: z.string().url().describe('The URL of the constitution PDF document.'),
});
export type SummarizeConstitutionInput = z.infer<typeof SummarizeConstitutionInputSchema>;

const SummarizeConstitutionOutputSchema = z.object({
  summary: z.string().describe('A concise, easy-to-understand summary of the constitution, formatted in Markdown.'),
});
export type SummarizeConstitutionOutput = z.infer<typeof SummarizeConstitutionOutputSchema>;

export async function summarizeConstitution(
  input: SummarizeConstitutionInput
): Promise<SummarizeConstitutionOutput> {
  return summarizeConstitutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeConstitutionPrompt',
  input: {schema: z.object({ constitutionText: z.string() })},
  output: {schema: SummarizeConstitutionOutputSchema},
  prompt: `You are an expert legal analyst specializing in simplifying complex documents for community groups.

Your task is to read the following constitution and provide a clear, concise summary. The summary should be easy for a layperson to understand.

**Key Instructions:**
*   Format the output in Markdown.
*   Use bullet points for key rules, rights, and responsibilities.
*   Start with a brief, one-paragraph overview of the constitution's purpose.
*   Keep the entire summary under 250 words.

**Constitution Text:**
{{{constitutionText}}}
`,
});

const summarizeConstitutionFlow = ai.defineFlow(
  {
    name: 'summarizeConstitutionFlow',
    inputSchema: SummarizeConstitutionInputSchema,
    outputSchema: SummarizeConstitutionOutputSchema,
  },
  async ({ constitutionUrl }) => {
    // Extract text from the PDF URL
    const constitutionText = await extractTextFromPdf(constitutionUrl);
    
    // Pass the extracted text to the prompt
    const {output} = await prompt({ constitutionText });
    return output!;
  }
);
