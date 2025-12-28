import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import connectDB from './config/database.js'
import { authRoutes, testRoutes, userRoutes, questionRoutes, chatbotRoutes } from './routes/index.js'

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret-key-change-in-production'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret-key-change-in-production'

if (ACCESS_TOKEN_SECRET === 'your-access-token-secret-key-change-in-production') {
  console.warn('⚠️  WARNING: Using default ACCESS_TOKEN_SECRET. Set a secure secret in production!')
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
  .use(
    jwt({
      name: 'jwt',
      secret: ACCESS_TOKEN_SECRET
    })
  )
  .use(
    jwt({
      name: 'refreshJwt',
      secret: REFRESH_TOKEN_SECRET
    })
  )
  .onBeforeHandle(async () => {
    await connectDB()
  })
  .get('/', () => ({ 
    status: 'online',
    message: 'Job Quiz API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/login, /register, /refresh, /logout',
      test: '/api/test',
      user: '/api/user',
      questions: '/api/questions',
      chatbot: '/api/chatbot'
    }
  }))
  .get('/health', () => ({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    uptime: process.uptime()
  }))
  .use((app) => {
    const jwtPlugin = app.decorator.jwt
    const refreshJwtPlugin = app.decorator.refreshJwt
    
    return app
      .use(authRoutes(jwtPlugin, refreshJwtPlugin))
      .use(testRoutes(jwtPlugin))
      .use(userRoutes(jwtPlugin))
      .use(questionRoutes(jwtPlugin))
      .use(chatbotRoutes(jwtPlugin))
  })

export default app