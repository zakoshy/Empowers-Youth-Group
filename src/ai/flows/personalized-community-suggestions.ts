'use server';

/**
 * @fileOverview Provides personalized community program suggestions based on user data.
 *
 * - getPersonalizedSuggestions - A function that returns personalized community program suggestions for a user.
 * - PersonalizedSuggestionsInput - The input type for the getPersonalizedSuggestions function.
 * - PersonalizedSuggestionsOutput - The return type for the getPersonalizedSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedSuggestionsInputSchema = z.object({
  memberId: z.string().describe('The ID of the member.'),
  investmentReports: z.string().describe('Summaries of investment reports.'),
  upcomingEvents: z.string().describe('Summaries of upcoming events.'),
  contributionSummary: z.string().describe('The member contribution summary.'),
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
  prompt: `You are an AI assistant designed to provide personalized community program suggestions to members of Empowers Youth Group.

  Based on the member's role, investment reports, upcoming events, and contribution summary, suggest programs that the member can effectively engage with the community.

  Member Role: {{{memberRole}}}
  Investment Reports: {{{investmentReports}}}
  Upcoming Events: {{{upcomingEvents}}}
  Contribution Summary: {{{contributionSummary}}}

  Provide a list of suggestions.
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
