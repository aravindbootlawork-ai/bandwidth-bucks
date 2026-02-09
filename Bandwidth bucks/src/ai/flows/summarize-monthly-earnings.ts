'use server';
/**
 * @fileOverview Provides a GenAI-powered summary of monthly earnings trends and potential areas for increased earnings based on bandwidth usage.
 *
 * - summarizeMonthlyEarnings - A function that generates the earnings summary.
 * - SummarizeMonthlyEarningsInput - The input type for the summarizeMonthlyEarnings function.
 * - SummarizeMonthlyEarningsOutput - The return type for the summarizeMonthlyEarnings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeMonthlyEarningsInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  monthlyEarnings: z
    .number()
    .describe('The user\'s total monthly earnings in INR.'),
  bandwidthUsedInGB: z
    .number()
    .describe('The amount of bandwidth used by the user in GB.'),
});
export type SummarizeMonthlyEarningsInput = z.infer<
  typeof SummarizeMonthlyEarningsInputSchema
>;

const SummarizeMonthlyEarningsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A summary of the user\'s monthly earnings trends and potential areas for increased earning based on bandwidth usage.'
    ),
});
export type SummarizeMonthlyEarningsOutput = z.infer<
  typeof SummarizeMonthlyEarningsOutputSchema
>;

export async function summarizeMonthlyEarnings(
  input: SummarizeMonthlyEarningsInput
): Promise<SummarizeMonthlyEarningsOutput> {
  return summarizeMonthlyEarningsFlow(input);
}

const summarizeMonthlyEarningsPrompt = ai.definePrompt({
  name: 'summarizeMonthlyEarningsPrompt',
  input: {schema: SummarizeMonthlyEarningsInputSchema},
  output: {schema: SummarizeMonthlyEarningsOutputSchema},
  prompt: `You are an AI assistant that summarizes monthly earnings trends and suggests ways to increase earnings based on bandwidth usage.

  User ID: {{{userId}}}
  Monthly Earnings (INR): {{{monthlyEarnings}}}
  Bandwidth Used (GB): {{{bandwidthUsedInGB}}}

  Provide a concise summary of the user\'s earnings and offer suggestions for improvement.
  Focus on how the user can maximize their earnings potential through increased bandwidth usage, while respecting the 5000 INR monthly cap.
  Consider the relationship between bandwidth used and earnings to identify opportunities for growth.
  Keep the summary short and actionable.
  `,
});

const summarizeMonthlyEarningsFlow = ai.defineFlow(
  {
    name: 'summarizeMonthlyEarningsFlow',
    inputSchema: SummarizeMonthlyEarningsInputSchema,
    outputSchema: SummarizeMonthlyEarningsOutputSchema,
  },
  async input => {
    const {output} = await summarizeMonthlyEarningsPrompt(input);
    return output!;
  }
);
