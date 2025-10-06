
'use server';

/**
 * @fileOverview Provides personalized community program suggestions based on user data.
 *
 * - getPersonalizedSuggestions - A function that returns personalized community program suggestions for a user.
 * - PersonalizedSuggestionsInput - The input type for the getPersonalizedSuggestions function.
 * - PersonalizedSuggestionsOutput - The return type for the getPersonalizedSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

const PersonalizedSuggestionsInputSchema = z.object({
  memberId: z.string().describe('The ID of the member.'),
  investmentReports: z.string().describe('Summaries of investment reports.'),
  upcomingEvents: z.string().describe('Summaries of upcoming events.'),
  contributionSummary: z.string().describe('A JSON string of the member contribution summary, including monthly and special contributions.'),
  memberRole: z.string().describe('The role of the member'),
});
export type PersonalizedSuggestionsInput = z.infer<typeof PersonalizedSuggestionsInputSchema>;

const PersonalizedSuggestionsOutputSchema = z.object({
  suggestions: z.string().describe('Personalized community program suggestions.'),
});
export type PersonalizedSuggestionsOutput = z.infer<typeof PersonalizedSuggestionsOutputSchema>;

export async function getPersonalizedSuggestions(
  input: PersonalizedSuggestionsInput
): Promise<PersonalizedSuggestionsOutput> {
  return personalizedSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedSuggestionsPrompt',
  input: {schema: PersonalizedSuggestionsInputSchema},
  output: {schema: PersonalizedSuggestionsOutputSchema},
  model: googleAI.model('gemini-pro'),
  prompt: `You are an AI financial mentor and community engagement advisor for The Empowers youth group. Your tone should be encouraging, supportive, and motivating.

  Your task is to analyze the provided member's financial data and provide personalized feedback and suggestions.

  1.  **Analyze Financial Status**: Review the 'Contribution Summary'. Look at their monthly contributions and any 'miniharambee' (special contributions) they have made.
  2.  **Provide Feedback**: Based on their financial consistency, praise their strengths (e.g., "Great job on being consistent with your monthly contributions!").
  3.  **Address Outstanding Contributions**: If there are gaps or outstanding debts in their monthly contributions, gently remind them. For example: "I see a few gaps in contributions for this year. Let's work on getting back on track! Every little bit helps us reach our collective goals." Encourage them to pay up to the current month or even surpass it if they can, highlighting their dedication.
  4.  **Suggest Engagement**: Based on their financial strength and role, suggest how they can engage with the community.
      -   If they are financially strong, suggest they take a lead in a fundraising event or mentor others.
      -   If they are struggling, suggest they attend a financial literacy workshop or join a collaborative project that doesn't require a financial commitment.

  Here is the data:
  Member Role: {{{memberRole}}}
  Contribution Summary: {{{contributionSummary}}}
  Upcoming Events: {{{upcomingEvents}}}
  Investment Reports: {{{investmentReports}}}

  Provide a concise, actionable list of suggestions in a few paragraphs.
  `,
});

const personalizedSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedSuggestionsFlow',
    inputSchema: PersonalizedSuggestionsInputSchema,
    outputSchema: PersonalizedSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
