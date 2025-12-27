import app from './src/index.js'
import connectDB from './src/config/database.js'

await connectDB();

export default async function handler(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api')) {
        url.pathname = url.pathname.replace('/api', '');
    }

    const newReq = new Request(url.toString(), request);

    return app.fetch(newReq);
}