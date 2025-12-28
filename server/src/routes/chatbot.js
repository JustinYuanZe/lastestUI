import { Elysia, t } from 'elysia'

const SYSTEM_PROMPT = `You are the Job Assistant for the Job Quiz web application.
Be concise, friendly, and practical.
Focus on IT careers: Technical, Business, Creative, Interdisciplinary.`;

function buildRequestPayload(userMessage, context) {
  const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Question: ${userMessage}`;
  
  return {
    contents: [{
      parts: [{
        text: fullPrompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  };
}

function generateQuickReplies(userMessage) {
  return ['Interview Tips', 'Career Path', 'Resume Help'];
}

export const chatbotRoutes = (jwt) => new Elysia()
  .post('/api/chatbot/message', async ({ body, set }) => {
    
    console.log("👉 [START] Request received (Using RAW FETCH)");

    try {
      const { message, context } = body;

      if (!message) {
        set.status = 400;
        return { error: 'Message required' };
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("❌ Missing API Key");
        set.status = 500;
        return { error: 'Server configuration error (Missing API Key)' };
      }

      const MODEL_NAME = 'gemini-2.5-flash'; 
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

      console.log(`👉 [FETCH] Calling Google API: ${MODEL_NAME}...`);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildRequestPayload(message, context))
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ [GOOGLE ERROR] Status: ${response.status}`, errorData);
        throw new Error(`Google API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
      
      console.log("✅ [SUCCESS] Reply received!");

      return {
        reply: replyText,
        quickReplies: generateQuickReplies(message),
        metadata: { model: MODEL_NAME, method: 'raw_fetch' }
      };

    } catch (error) {
      console.error(`❌ [ERROR]: ${error.message}`);
      set.status = 500;
      
      return {
        reply: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        quickReplies: ["Try Again"],
        metadata: { error: error.message }
      };
    }
  }, {
    body: t.Object({
      message: t.String(),
      context: t.Optional(t.Any())
    })
  })