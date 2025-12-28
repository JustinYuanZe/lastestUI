import { Elysia } from 'elysia'
import { authRoutes } from './auth'
import { questionRoutes } from './questions'
import { testRoutes } from './test'
import { chatbotRoutes } from './chatbot'

const router = (jwt) => new Elysia()
    .use(authRoutes(jwt))
    .use(questionRoutes(jwt))
    .use(testRoutes(jwt))
    .use(chatbotRoutes(jwt))

export default router