'use server';

/**
 * @fileOverview Provides AI-powered financial analytics for the group's treasurer.
 *
 * - getTreasurerInsights - A function that returns insights on member contributions.
 * - TreasurerInsightsInput - The input type for the getTreasurerInsights function.
 * - TreasurerInsightsOutput - The return type for the getTreasurerInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TreasurerInsightsInputSchema = z.object({
  allMembersData: z.string().describe('A JSON string representing an array of all members and their contribution data for the current year. Each member object includes their name, monthly contributions, and special contributions.'),
  totalFunds: z.number().describe('The total funds collected by the group so far.'),
  monthlyTarget: z.number().describe('The target monthly contribution per member.'),
});
export type TreasurerInsightsInput = z.infer<typeof TreasurerInsightsInputSchema>;

const TreasurerInsightsOutputSchema = z.object({
  insights: z.string().describe('A markdown-formatted string of financial insights and analytics for the treasurer.'),
});
export type TreasurerInsightsOutput = z.infer<typeof TreasurerInsightsOutputSchema>;

export async function getTreasurerInsights(
  input: TreasurerInsightsInput
): Promise<TreasurerInsightsOutput> {
  return treasurerInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'treasurerInsightsPrompt',
  input: {schema: TreasurerInsightsInputSchema},
  output: {schema: TreasurerInsightsOutputSchema},
  prompt: `You are an expert financial analyst and advisor for the treasurer of a community youth group. Your tone should be professional, insightful, and action-oriented.

Your task is to analyze the financial data for all group members for the current year and provide a concise summary of insights and actionable recommendations for the treasurer.

**Group Financials:**
*   Total Collected Funds: Ksh {{{totalFunds}}}
*   Monthly Contribution Target Per Member: Ksh {{{monthlyTarget}}}

**Member Data:**
{{{allMembersData}}}

**Your Analysis should be formatted in Markdown and include the following sections:**

1.  **Top Performers:**
    *   Identify and list 2-3 members who have been most consistent with their monthly contributions.
    *   Identify and list 2-3 members who have made the largest special contributions (miniharambees).
    *   Briefly state why it's important to acknowledge them (e.g., "Recognizing their commitment can motivate others.").

2.  **Members to Engage:**
    *   Identify members with significant outstanding balances or inconsistent payment histories. List their names.
    *   Provide a templated, friendly reminder message that the treasurer can send. The message should be encouraging, not demanding. For example: "Hi [Name], just a friendly reminder about your monthly contributions. Every bit helps us reach our group goals! Let us know if you have any questions."

3.  **Overall Trends & Insights:**
    *   Calculate the group's overall consistency rate for monthly contributions (percentage of total expected vs. total collected).
    *   Mention which months had the highest total contributions (including miniharambees).
    *   Provide one key insight, e.g., "The group's financial health is strong, but consistency could be improved," or "Special contributions are significantly boosting our funds."

4.  **Actionable Recommendations:**
    *   Provide 2-3 concrete, actionable steps the treasurer can take. For example: "Consider setting a group goal for the next quarter," or "Organize a brief session to remind everyone of the importance of contributions."
`,
});

const treasurerInsightsFlow = ai.defineFlow(
  {
    name: 'treasurerInsightsFlow',
    inputSchema: TreasurerInsightsInputSchema,
    outputSchema: TreasurerInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
