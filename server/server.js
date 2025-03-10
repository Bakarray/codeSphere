// Import dotenv for environment variables
require('dotenv').config();

// Import Node.js core modules
const http = require('node:http');
const url = require('node:url');
const path = require('node:path');
const extname = path.extname;
const fs = require('node:fs');


// Import local module (apiFuncs.cjs)
const api = require('./apiFuncs.js');



// create a HTTP server
const server = http.createServer((req, res) => {
    const { pathname } = url.parse(req.url, true);
    const method = req.method;

    // Set CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins

    // Handle preflight OPTIONS requests
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Allowed methods
            'Access-Control-Allow-Headers': 'Content-Type, Authorization' // Allowed headers
        });
        res.end();
        return;
    }
    // API requests
    if (pathname.startsWith('/api/')) {
        if (pathname === '/api/register' && method === 'POST') {
            api.register(req, res);
        } else if (pathname === '/api/posts' && method === 'GET') {
            api.getPosts(req, res);
        } else if (pathname === '/api/login' && method === 'POST') {
            api.login(req, res);
        } else if (pathname === '/api/posts' && method === 'POST') {
            api.authenticate(req, res, () => api.createPost(req, res, req.user));
        } else if (pathname.match(/^\/api\/posts\/\d+$/) && method === 'GET') {
            const id = pathname.split('/')[3];
            api.getPost(req, res, id);
        } else if (pathname.match(/^\/api\/posts\/\d+\/comments$/) && method === 'POST') {
            console.log('here');
            const postId = pathname.split('/')[3];
            api.authenticate(req, res, () => api.addComment(req, res, req.user, postId));
        }
    } else {
        // Serve static files from the 'public' dir
        const filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname)
        const ext = extname(filePath)
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript'
        }[ext] || 'text/plain';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(200, {'Content-Type': contentType});
                res.end(content);
            }
        });
    }
  });
  
  server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });