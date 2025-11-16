
'use server';

/**
 * @fileOverview Provides AI-powered investment suggestions for the youth group.
 *
 * - getInvestmentSuggestions - A function that returns investment ideas based on available funds.
 * - InvestmentSuggestionsInput - The input type for the getInvestmentSuggestions function.
 * - InvestmentSuggestionsOutput - The return type for the getInvestmentSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InvestmentSuggestionsInputSchema = z.object({
  totalFunds: z.number().describe('The total amount of funds available for investment in Kenyan Shillings (Ksh).'),
});
export type InvestmentSuggestionsInput = z.infer<typeof InvestmentSuggestionsInputSchema>;

const InvestmentSuggestionsOutputSchema = z.object({
  suggestions: z.string().describe('A markdown-formatted string of viable investment project suggestions for the youth group.'),
});
export type InvestmentSuggestionsOutput = z.infer<typeof InvestmentSuggestionsOutputSchema>;

export async function getInvestmentSuggestions(
  input: InvestmentSuggestionsInput
): Promise<InvestmentSuggestionsOutput> {
  return investmentSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'investmentSuggestionsPrompt',
  input: {schema: InvestmentSuggestionsInputSchema},
  output: {schema: InvestmentSuggestionsOutputSchema},
  model: 'googleai/gemini-pro',
  prompt: `You are an expert investment advisor for a community-based youth group in a rural Kenyan village. The group's mission is to achieve financial self-reliance and fund community projects.

Your task is to analyze the group's total available capital and suggest 3-4 viable, sustainable, and scalable investment projects.

**Key Considerations:**
*   **Context:** The projects must be suitable for a rural/village setting in Kenya.
*   **Scalability:** The ideas should have the potential to start small and grow as the group's capital increases.
*   **Community Impact:** Prioritize projects that can also benefit the community (e.g., job creation, providing needed services).
*   **Feasibility:** The projects should be manageable by a youth group with varied skills.

**Available Capital:** Ksh {{{totalFunds}}}

Please provide a concise, actionable list of investment suggestions. Format your response in Markdown. For each suggestion, include a brief title, a one-sentence summary of the project, and a short paragraph explaining its potential and why it's a good fit.
`,
});

const investmentSuggestionsFlow = ai.defineFlow(
  {
    name: 'investmentSuggestionsFlow',
    inputSchema: InvestmentSuggestionsInputSchema,
    outputSchema: InvestmentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
