import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import connectDB from './config/database.js'
import { authRoutes, testRoutes, userRoutes, questionRoutes } from './routes/index.js'

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'default-secret'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret'

const SYSTEM_PROMPT = `You are the Job Assistant. Be concise and practical. Focus on IT careers.`;

function buildRequestPayload(userMessage) {
  return {
    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userMessage}` }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
  };
}

const app = new Elysia()
  .use(cors({
    origin: [
      'https://jobquiz.vercel.app',
      'https://www.jobquiz.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:1409',
      'http://localhost:3000'
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }))
  .use(jwt({ name: 'jwt', secret: ACCESS_TOKEN_SECRET }))
  .use(jwt({ name: 'refreshJwt', secret: REFRESH_TOKEN_SECRET }))
  
  .get('/', () => ({ status: 'online', version: '1.0.0' }))
  
  .get('/health', async () => {
    try {
        await connectDB();
        return { status: 'ok', db: 'connected' }
    } catch (e) {
        return { status: 'error', error: e.message }
    }
  })

  .post('/api/chatbot/message', async ({ body, set }) => {
    console.log("👉 [DIRECT] Request received at index.js");
    
    try {
        const { message } = body;
        if (!message) { set.status = 400; return { error: 'Message required' }; }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("❌ Missing API Key");
            return { reply: "System Error: Missing API Key" };
        }

        const MODEL_NAME = 'gemini-2.5-flash';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;
        
        console.log(`👉 [FETCH] Calling ${MODEL_NAME}...`);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildRequestPayload(message))
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ [GOOGLE FAIL] ${response.status}`, errText);
            throw new Error(`Google Error: ${response.status}`);
        }

        const data = await response.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text.";
        
        console.log("✅ [SUCCESS] Reply sent.");
        return {
            reply: replyText,
            quickReplies: ['Interview Tips', 'Career Path'],
            metadata: { model: MODEL_NAME, method: 'direct_fetch' }
        };

    } catch (error) {
        console.error("❌ [ERROR]", error);
        return {
            reply: "I am currently overloaded. Please try again in 1 minute.",
            quickReplies: ["Retry"],
            metadata: { error: error.message }
        };
    }
  }, {
    body: t.Object({
        message: t.String(),
        context: t.Optional(t.Any())
    })
  })

  .use((app) => {
    const jwtPlugin = app.decorator.jwt
    const refreshJwtPlugin = app.decorator.refreshJwt
    
    app.use(authRoutes(jwtPlugin, refreshJwtPlugin))
    
    if (typeof testRoutes === 'function') app.use(testRoutes(jwtPlugin))
    else app.use(testRoutes)

    if (typeof userRoutes === 'function') app.use(userRoutes(jwtPlugin))
    else app.use(userRoutes)

    if (typeof questionRoutes === 'function') app.use(questionRoutes(jwtPlugin))
    else app.use(questionRoutes)

    return app
  })

export default app