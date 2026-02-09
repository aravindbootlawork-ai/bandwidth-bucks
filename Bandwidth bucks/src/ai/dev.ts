import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-monthly-earnings.ts';
import '@/ai/flows/validate-and-explain-payout-request.ts';