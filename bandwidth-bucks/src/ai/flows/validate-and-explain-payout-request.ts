'use server';

/**
 * @fileOverview Validates a payout request and provides an explanation if it fails.
 *
 * - validateAndExplainPayoutRequest - A function that validates a payout request and explains any failures.
 * - ValidatePayoutInput - The input type for the validateAndExplainPayoutRequest function.
 * - ValidatePayoutOutput - The return type for the validateAndExplainPayoutRequest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidatePayoutInputSchema = z.object({
  payoutMethod: z.enum(['UPI', 'PayPal']).describe('The payout method selected by the user.'),
  payoutAmount: z.number().describe('The amount the user wishes to withdraw.'),
  userEarnings: z.number().describe('The user\'s current total earnings.'),
  exchangeRate: z.number().optional().describe('The current USD to INR exchange rate. Required if payout method is PayPal.'),
});
export type ValidatePayoutInput = z.infer<typeof ValidatePayoutInputSchema>;

const ValidatePayoutOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the payout request is valid or not.'),
  explanation: z.string().describe('An explanation of why the payout request is invalid, if applicable.'),
});
export type ValidatePayoutOutput = z.infer<typeof ValidatePayoutOutputSchema>;

export async function validateAndExplainPayoutRequest(
  input: ValidatePayoutInput
): Promise<ValidatePayoutOutput> {
  return validateAndExplainPayoutRequestFlow(input);
}

const validatePayoutPrompt = ai.definePrompt({
  name: 'validatePayoutPrompt',
  input: {schema: ValidatePayoutInputSchema},
  output: {schema: ValidatePayoutOutputSchema},
  prompt: `You are a payout validation expert. You will determine if a user's payout request is valid based on the following criteria:

  - Minimum payout amount: 50 INR for UPI, 1 USD for PayPal.
  - Monthly earnings cap: 5000 INR.
  - The payout amount cannot exceed the user's total earnings.

  If the payout method is PayPal, use the provided exchange rate to convert the payout amount from USD to INR before checking against the monthly earnings cap.

  Given the following information, determine if the payout request is valid and provide an explanation. Respond using JSON format.

  Payout Method: {{{payoutMethod}}}
  Payout Amount: {{{payoutAmount}}}
  User Earnings: {{{userEarnings}}}
  Exchange Rate (USD to INR): {{#if exchangeRate}}{{{exchangeRate}}}{{else}}N/A{{/if}}

  Here's how to perform the validation:

  1.  **Minimum Payout Check**: If payoutMethod is "UPI" and payoutAmount is less than 50, isValid is false. If payoutMethod is "PayPal" and payoutAmount is less than 1, isValid is false.
  2.  **Earnings Cap Check**: If payoutMethod is "PayPal", convert payoutAmount to INR using exchangeRate.  If the userEarnings exceeds 5000 INR, isValid should be false.
  3.  **Exceeds Earnings**: If payoutAmount is greater than userEarnings, isValid is false.
  4.  If none of the above is false, isValid is true.

  Explanation should clearly articulate why the payout is invalid. Be specific. If valid, explanation should be 'Payout request is valid'.
  The response *MUST* be valid JSON of the following format:
  \{
    "isValid": boolean,
    "explanation": string
  \}
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const validateAndExplainPayoutRequestFlow = ai.defineFlow(
  {
    name: 'validateAndExplainPayoutRequestFlow',
    inputSchema: ValidatePayoutInputSchema,
    outputSchema: ValidatePayoutOutputSchema,
  },
  async input => {
    const {output} = await validatePayoutPrompt(input);
    return output!;
  }
);
