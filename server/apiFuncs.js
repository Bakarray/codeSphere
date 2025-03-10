
const { createHmac, pbkdf2, randomBytes } = require("crypto");
const {Pool} = require("pg");


const JWT_SECRET = process.env.JWT_SECRET;

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10)
})

// Helper function to read request body as JSON
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (err) {
                reject(err);
            }
        });
    });
}

// Helper function to hash password
function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = randomBytes(16).toString('hex');
        pbkdf2(password, salt, 1000, 64, 'sha512', (err, key) => {
            if (err) reject(err);
            resolve(`${salt}:${key.toString('hex')}`);
        });
    });
}

// Helper function to verify password against stored hash
function verifyPassword(stored, supplied) {
    return new Promise((resolve, reject) => {
        const [salt, key] = stored.split(':');

        // use pbkdf2 to hash the supplied password with the same salt
        pbkdf2(supplied, salt, 1000, 64, 'sha512', (err, derivedKey) => {
            if (err) reject(err);
            resolve(key === derivedKey.toString('hex'));
        });
    });
}


// Generate JWT token for authenticated users
function generateToken(user) {
    const payload = {id: user.id, username: user.username};
    const header = {alg: 'HS256', typ: 'JWT'};
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac('sha256', JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT token from 'Authorization' header
function verifyToken(token) {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    const expectedSignature = createHmac('sha256', JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64url');
    if (signature !== expectedSignature) throw new Error('Invalid token');
    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
}


async function register(req, res) {
    try {
        const { username, email, password } = await readBody(req);

        if (!username || !email || !password) {
            req.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing required fields' }));
            return;
        }
        const hashedPassword = await hashPassword(password);
        console.log(hashedPassword);
        const result = await pool.query(
            'INSERT INTO USERS (username, email, password) VALUES ($1, $2, $3) RETURNING id, username',
            [username, email, hashedPassword]
        );
        const token = generateToken(result.rows[0]);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token }));
    } catch (err) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Username or email already exists' }));
    }
}

async function createPost(req, res, user) {
    try {
        const { title, content } = await readBody(req);
        if (!title || !content) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Title and content are required' }));
            return;
        }
        const result = await pool.query(
            'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING id', 
            [title, content, user.id]
        );
        console.log('result: ', result);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: result.rows[0].id }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}


async function getPosts(req, res) {
    try {
        const result = await pool.query(
            `SELECT p.id, p.title, p.created_at, u.username ` +
            `FROM posts p JOIN users u ON p.user_id = u.id ` +
            `ORDER BY p.created_at DESC`
        );
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(result.rows));
    } catch (err) {
        res.writeHead(500, 'server error', {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Internal server error'}));
    }
}

async function login(req, res) {
    try {
        // collect form values
        const { username, password } = await readBody(req);
        if (!username || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing required fields' }));
            return;
        }
        // check user exists
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])
        if (!result.rows.length) throw new Error('Invalid username or password');
        const user = result.rows[0];
        if (!(await verifyPassword(user.password, password))) {
            throw new Error('Invalid username or password');
        }

        // create and send jwt token
        const token = generateToken(user);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({token}));
    } catch (err) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Login failed' }));
    }
}

// Authentication middleware for protected routes
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({error: 'Unauthorized'}));
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        req.user = verifyToken(token);
        next();
    } catch (err) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({error: 'Invalid token'}));
    }
}

module.exports = {
    register,
    getPosts,
    login, 
    authenticate,
    createPost
};