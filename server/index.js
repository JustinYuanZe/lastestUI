import app from './src/index.js'
import connectDB from './src/config/database.js'

await connectDB();

export default app;