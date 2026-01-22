import http from 'node:http';
import 'dotenv/config'; // Load .env
import { connectDatabase } from './database.js'; // DB Connection
import { jsonHandler } from './middlewares/jsonHandler.js';
import { routes } from './routes.js'; 

connectDatabase(); // Start connection

const server = http.createServer(async (req, res) => {
    const { method, url } = req;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight Request
    if (method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    await jsonHandler(req, res);

    const route = routes.find(route => {
        return route.method === method && route.path.test(url);
    });

    if (route) {
        const routeParams = req.url.match(route.path);
        
        // Extract params if any (e.g. /tasks/:id)
        const { ...params } = routeParams.groups || {};
        req.params = params;

        return route.handler(req, res);
    }

    return res.writeHead(404).end();
});

server.listen(3333, () => {
    console.log('Server running on port 3333');
});
