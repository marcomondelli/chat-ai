require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const useGroq = !!process.env.GROQ_API_KEY;
const client = useGroq
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const model = useGroq ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';

const CHAT_TOPIC = (process.env.CHAT_TOPIC || '').trim();
const COMPANY_KNOWLEDGE_PATH = (process.env.COMPANY_KNOWLEDGE_PATH || '').trim();
let companyContext = '';
if (COMPANY_KNOWLEDGE_PATH) {
  try {
    const fullPath = path.resolve(process.cwd(), COMPANY_KNOWLEDGE_PATH);
    companyContext = fs.readFileSync(fullPath, 'utf8').trim();
    if (companyContext) console.log('Company context loaded from', COMPANY_KNOWLEDGE_PATH);
  } catch (err) {
    console.warn('Company knowledge file not found:', COMPANY_KNOWLEDGE_PATH, err.message);
  }
}

function getSystemPrompt() {
  let base =
    'You are a helpful, friendly, and concise assistant. You must ALWAYS respond in English only. Never switch to Italian or any other language, even if the user writes in another language—keep your reply in English. The only exception is if the user explicitly asks you to answer in a specific language.';
  if (companyContext) {
    base +=
      '\n\nUse ONLY the following information about the company to answer questions. Do not invent or assume anything not stated here. If the user asks something not covered by this information, say you do not have that information.\n\n---\n\n' +
      companyContext;
  }
  if (CHAT_TOPIC) {
    base += ` You must ONLY answer questions about: ${CHAT_TOPIC}. If the user asks about anything else, politely say you can only help with topics related to "${CHAT_TOPIC}" and invite them to ask within that scope.`;
  }
  return base;
}

app.get('/health', (_, res) => {
  res.json({
    ok: true,
    provider: useGroq ? 'groq' : 'openai',
    topic: CHAT_TOPIC || null,
    companyContext: !!companyContext,
  });
});

app.get('/api/config', (_, res) => {
  res.json({ topic: CHAT_TOPIC || null });
});

app.post('/api/chat', async (req, res) => {
  const hasKey = useGroq ? process.env.GROQ_API_KEY : process.env.OPENAI_API_KEY;
  if (!hasKey) {
    return res.status(500).json({
      error: useGroq
        ? 'GROQ_API_KEY not set. Create a .env file (see .env.example) or use OPENAI_API_KEY.'
        : 'OPENAI_API_KEY not set. For free tier set GROQ_API_KEY in .env (see README).',
    });
  }
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }
  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'system', content: getSystemPrompt() }, ...messages],
      max_tokens: 1024,
    });
    const reply = completion.choices[0]?.message?.content ?? 'No response.';
    res.json({ message: reply });
  } catch (err) {
    console.error(err);
    res.status(err.status ?? 500).json({ error: err.message ?? 'Error calling the API.' });
  }
});

// From server/: frontend is in ../client/dist
const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
