// api/index.js
const app = require('../server');

module.exports = (req, res) => {
    // Log incoming requests
    console.log(`[Vercel Handler] ${req.method} ${req.url}`);
    return app(req, res);
};