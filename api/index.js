import app from '../server/index.js';

export default async function handler(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api')) {
        url.pathname = url.pathname.replace('/api', '');
    }

    const newReq = new Request(url.toString(), request);
    return app.fetch(newReq);
}