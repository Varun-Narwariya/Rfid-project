
// Simple Node.js server for RFID prototype
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let scans = [];

// Live events for dashboard
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendUpdate = () => {
        res.write(`data: ${JSON.stringify(scans.slice(-20))}\n\n`);
    };
    const interval = setInterval(sendUpdate, 2000);
    req.on('close', () => clearInterval(interval));
});

// API to add scans
app.post('/scan', (req, res) => {
    const { uid, checkpoint } = req.body;
    if (!uid || !checkpoint) {
        return res.status(400).json({ error: 'Missing uid or checkpoint' });
    }
    const hash = crypto.createHash('sha256').update(uid + checkpoint + Date.now()).digest('hex');
    const entry = { uid, checkpoint, time: new Date().toISOString(), hash };
    scans.push(entry);
    console.log("New scan:", entry);
    res.json({ status: 'ok', entry });
});

// API to fetch recent scans
app.get('/scans', (req, res) => {
    res.json(scans.slice(-20));
});

// Stats
app.get('/stats', (req, res) => {
    const stats = {};
    scans.slice(-100).forEach(s => {
        stats[s.checkpoint] = (stats[s.checkpoint] || 0) + 1;
    });
    res.json(stats);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
