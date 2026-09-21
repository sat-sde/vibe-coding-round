import OpenAI from 'openai';

let openaiClient = null;

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured. Please set it in your .env file.');
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
};

const TONE_INSTRUCTIONS = {
  professional: 'Respond clearly, professionally and naturally.',
  casual: 'Respond in a friendly, conversational and natural way.',
  concise: 'Respond briefly and directly without unnecessary detail.',
};

/**
 * Stream a chat completion via SSE.
 * @param {import('express').Response} res - Express response for SSE
 * @param {Array} history - Previous messages [{role, content}]
 * @param {string} userMessage - The new user message
 * @param {string} tone - One of 'professional' | 'casual' | 'concise'
 * @returns {Promise<string>} The full assistant response
 */
export const streamChatResponse = async (res, history, userMessage, tone = 'professional') => {
  const client = getOpenAIClient();

  const systemInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.professional;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const stream = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    stream: true,
  });

  let fullContent = '';

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      fullContent += delta;
      // SSE format: data: <json>\n\n
      res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
    }
  }

  // Signal completion
  res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
  res.end();

  return fullContent;
};
