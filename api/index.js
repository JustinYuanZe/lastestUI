import app from './src/index.js'
import connectDB from './src/config/database.js'

await connectDB();

export default app;

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
        console.log(`🐹 Elysia is running at http://localhost:${PORT}`)
    })
}