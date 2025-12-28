import { Elysia, t } from 'elysia'
import { GoogleGenerativeAI } from '@google/generative-ai'

const BYPASS_AI = true;

const SYSTEM_PROMPT = `You are a helpful Career Assistant.`;

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);

export const chatbotRoutes = (jwt) => new Elysia()
  .post('/api/chatbot/message', async ({ body, set }) => {
    
    const startTime = Date.now();
    log("👉 [START] Request received at /api/chatbot/message");

    try {
      const { message } = body

      if (!message) {
        set.status = 400
        return { error: 'Message required' }
      }

      if (BYPASS_AI) {
        log("🚀 [BYPASS MODE] Skipping Google API to test Server Latency.");
        
        await new Promise(r => setTimeout(r, 1000));
        
        log("✅ [SUCCESS] Server is responding!");
        return {
          reply: `[DIAGNOSTIC MODE] Server is WORKING! \n\nI received your message: "${message}". \n\n(Since I replied instantly, the issue is confirmed to be the connection to Google API).`,
          quickReplies: ["Test Passed", "Server OK"],
          metadata: { mode: 'bypass_ai', duration: Date.now() - startTime }
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        log("❌ Missing API Key");
        throw new Error("Missing API Key");
      }

      log("👉 [CONNECTING] Initializing Gemini...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      log("👉 [SENDING] Sending prompt to Google...");
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Google API Timeout (10s Limit)")), 10000)
      );

      const result = await Promise.race([
        model.generateContent(SYSTEM_PROMPT + "\nUser: " + message),
        timeoutPromise
      ]);

      log("👉 [RECEIVED] Google responded!");
      const response = await result.response;
      const text = response.text();

      log(`✅ [DONE] Finished in ${Date.now() - startTime}ms`);

      return {
        reply: text,
        quickReplies: [],
        metadata: { model: 'gemini-2.5-flash' }
      }

    } catch (error) {
      log(`❌ [ERROR] ${error.message}`);
      set.status = 500;
      
      return {
        reply: `DIAGNOSTIC ERROR: ${error.message}. (Check Vercel Logs for details)`,
        quickReplies: ["Retry"],
        metadata: { error: error.message }
      }
    }
  }, {
    body: t.Object({
      message: t.String(),
      context: t.Optional(t.Any())
    })
  })