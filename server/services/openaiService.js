import OpenAI from 'openai';

// Mistral's API is OpenAI-compatible — we use the OpenAI SDK with a custom baseURL
let mistralClient = null;

const getMistralClient = () => {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not configured. Please set it in your .env file.');
  }
  if (!mistralClient) {
    mistralClient = new OpenAI({
      apiKey: process.env.MISTRAL_API_KEY,
      baseURL: 'https://api.mistral.ai/v1',
    });
  }
  return mistralClient;
};

const TONE_INSTRUCTIONS = {
  professional: 'Respond clearly, professionally and naturally.',
  casual: 'Respond in a friendly, conversational and natural way.',
  concise: 'Respond briefly and directly without unnecessary detail.',
};

// Fast & free-tier friendly Mistral model
const MODEL = 'ministral-8b-latest';

/**
 * Stream a chat completion via SSE (Server-Sent Events).
 * Headers are already set by the controller before calling this.
 * @param {import('express').Response} res - Express response
 * @param {Array} history - Previous messages [{role, content}]
 * @param {string} userMessage - The new user message
 * @param {string} tone - 'professional' | 'casual' | 'concise'
 * @returns {Promise<string>} The full assembled assistant response
 */
export const streamChatResponse = async (res, history, userMessage, tone = 'professional') => {
  const client = getMistralClient();

  const systemInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const stream = await client.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullContent += delta;
      res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
    }
  }

  // Signal completion with the full assembled content
  res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
  res.end();

  return fullContent;
};
