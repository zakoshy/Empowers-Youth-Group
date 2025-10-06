import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleAI as googleAIV1} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI(), googleAIV1()],
});
