
// // // Simple Node.js server for RFID prototype
// // const express = require('express');
// // const cors = require('cors');
// // const crypto = require('crypto');
// // const path = require('path');

// // const app = express();
// // app.use(cors());
// // app.use(express.json());
// // app.use(express.static(path.join(__dirname, 'public')));

// // let scans = [];

// // // Live events for dashboard
// // app.get('/events', (req, res) => {
// //     res.setHeader('Content-Type', 'text/event-stream');
// //     res.setHeader('Cache-Control', 'no-cache');
// //     res.setHeader('Connection', 'keep-alive');
// //     res.flushHeaders();

// //     const sendUpdate = () => {
// //         res.write(`data: ${JSON.stringify(scans.slice(-20))}\n\n`);
// //     };
// //     const interval = setInterval(sendUpdate, 2000);
// //     req.on('close', () => clearInterval(interval));
// // });

// // // API to add scans
// // app.post('/scan', (req, res) => {
// //     const { uid, checkpoint } = req.body;
// //     if (!uid || !checkpoint) {
// //         return res.status(400).json({ error: 'Missing uid or checkpoint' });
// //     }
// //     const hash = crypto.createHash('sha256').update(uid + checkpoint + Date.now()).digest('hex');
// //     const entry = { uid, checkpoint, time: new Date().toISOString(), hash };
// //     scans.push(entry);
// //     console.log("New scan:", entry);
// //     res.json({ status: 'ok', entry });
// // });

// // // API to fetch recent scans
// // app.get('/scans', (req, res) => {
// //     res.json(scans.slice(-20));
// // });

// // // Stats
// // app.get('/stats', (req, res) => {
// //     const stats = {};
// //     scans.slice(-100).forEach(s => {
// //         stats[s.checkpoint] = (stats[s.checkpoint] || 0) + 1;
// //     });
// //     res.json(stats);
// // });

// // const PORT = process.env.PORT || 8080;
// // app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
// const express = require('express');
// const cors = require('cors');
// const crypto = require('crypto');
// const path = require('path');
// const { getUser, registerUser } = require('./TempleAccess.js');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// let scans = [];

// // SSE: live events
// app.get('/events', (req, res) => {
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');
//     res.flushHeaders();

//     const sendUpdate = () => {
//         res.write(`data: ${JSON.stringify(scans.slice(-20))}\n\n`);
//     };
//     const interval = setInterval(sendUpdate, 2000);
//     req.on('close', () => clearInterval(interval));
// });

// // Add scan
// app.post('/scan', async (req, res) => {
//     const { uid, checkpoint } = req.body;
//     if (!uid || !checkpoint) return res.status(400).json({ error: 'Missing uid or checkpoint' });

//     const user = await getUser(uid);
//     if (!user) return res.status(404).json({ error: 'UID not registered' });

//     const hash = crypto.createHash('sha256').update(uid + checkpoint + Date.now()).digest('hex');
//     const entry = { uid, checkpoint, time: new Date().toISOString(), hash, name: user.name };
//     scans.push(entry);

//     console.log("New scan:", entry);
//     res.json({ status: 'ok', entry });
// });

// // Fetch recent scans
// app.get('/scans', (req, res) => {
//     res.json(scans.slice(-20));
// });

// // Stats per checkpoint
// app.get('/stats', (req, res) => {
//     const stats = {};
//     scans.slice(-100).forEach(s => {
//         stats[s.checkpoint] = (stats[s.checkpoint] || 0) + 1;
//     });
//     res.json(stats);
// });

// app.post("/registerUser", async (req, res) => {
//   const { uid, name } = req.body;
//   if (!uid || !name) return res.status(400).json({ error: "Missing uid or name" });

//   try {
//     const receipt = await registerUser(uid, "dummyAadhaarHash", name);
//     res.json({ status: "ok", receipt });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Registration failed" });
//   }
// });


// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
// server.js
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const crypto = require('crypto');
// const path = require('path');

// const { getUser, registerUser } = require('./TempleAccess'); // our smart contract helper

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// // ======================
// // In-memory scan storage
// // ======================


// // ======================
// // SSE for live updates
// // ======================
// let clients = [];
// app.get("/events", (req, res) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");
//   res.flushHeaders();

//   clients.push(res);
//   req.on("close", () => {
//     clients = clients.filter(c => c !== res);
//   });
// });

// function broadcast(data) {
//   clients.forEach(res => res.write(`data: ${JSON.stringify(data)}\n\n`));
// }

// // ======================
// // Fetch recent scans
// // ======================
// app.get('/scans', (req, res) => {
//   res.json(scans.slice(-20));
// });

// // ======================
// // Submit new scan
// // ======================
// app.post('/scan', async (req, res) => {
//   const { uid, checkpoint } = req.body;
//   if (!uid || !checkpoint) {
//     return res.status(400).json({ error: 'Missing uid or checkpoint' });
//   }

//   try {
//     const user = await getUser(uid);

//     if (!user) {
//       const payload = {
//         status: "not_registered",
//         uid,
//         checkpoint,
//         time: new Date().toISOString()
//       };

//       scans.push(payload);
//       console.log("Unregistered UID scanned:", uid);

//       // broadcast to React dashboards
//       // (SSE clients connected to /events)
//       broadcast(payload);

//       // respond to ESP32 so it doesn’t hang
//       return res.json({ error: "UID not registered" });
//     }

//     // If user is found
//     const hash = crypto.createHash("sha256")
//       .update(uid + checkpoint + Date.now())
//       .digest("hex");

//     const entry = {
//       status: "registered",
//       uid,
//       checkpoint,
//       time: new Date().toISOString(),
//       hash,
//       name: user.name,
//     };

//     scans.push(entry);
//     broadcast(entry);

//     res.json({ status: "ok", entry });
//   } catch (err) {
//     console.error("Error in /scan:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });


// // ======================
// // Register new user
// // ======================
// app.post('/registerUser', async (req, res) => {
//   const { uid, name, aadhar } = req.body; // <-- match frontend

//   if (!uid || !name || !aadhar) {
//     return res.status(400).json({ error: 'Missing uid, name, or aadhar' });
//   }

//   try {
//     // Pass aadhar string directly (your templeAccess helper will hash it into bytes32)
//     const receipt = await registerUser(uid, aadhar, name);

//     // Convert BigInt fields to string for JSON
//     const serialized = {
//       transactionHash: receipt.transactionHash,
//       gasUsed: receipt.gasUsed.toString(),
//       status: receipt.status,
//     };

//     console.log(`✅ User registered: ${uid} - ${name} - Aadhar: ${aadhar}`);
//     res.json({ status: 'ok', receipt: serialized });
//   } catch (err) {
//     console.error('Error in /registerUser:', err);
//     res.status(500).json({ error: 'Registration failed', details: err.message });
//   }
// });


// // ======================
// // Get basic stats
// // ======================
// app.get('/stats', (req, res) => {
//   const stats = {};
//   scans.slice(-100).forEach((s) => {
//     stats[s.checkpoint] = (stats[s.checkpoint] || 0) + 1;
//   });
//   res.json(stats);
// });

// // ======================
// // Start server
// // ======================
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getUser, registerUser } = require('./TempleAccess'); // smart contract helper

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ======================
// In-memory scan + tokens
// ======================
let scans = [];
let activeTokens = {}; // { uid: token }

// ======================
// SSE for live updates
// ======================
let clients = [];
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

function broadcast(data) {
  clients.forEach(res => res.write(`data: ${JSON.stringify(data)}\n\n`));
}

// ======================
// Fetch recent scans
// ======================
app.get('/scans', (req, res) => {
  res.json(scans.slice(-20));
});

// ======================
// Submit new scan (from ESP32)
// ======================
app.post('/scan', async (req, res) => {
  const { uid, checkpoint, token } = req.body;
  if (!uid || !checkpoint) {
    return res.status(400).json({ error: 'Missing uid or checkpoint' });
  }

  try {
    // Verify token
    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.uid !== uid) {
        return res.status(401).json({ error: "Token UID mismatch" });
      }
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await getUser(uid);

    if (!user) {
      const payload = {
        status: "not_registered",
        uid,
        checkpoint,
        time: new Date().toISOString()
      };

      scans.push(payload);
      broadcast(payload);

      console.log("Unregistered UID scanned:", uid);
      return res.json({ error: "UID not registered" });
    }

    const hash = crypto.createHash("sha256")
      .update(uid + checkpoint + Date.now())
      .digest("hex");

    const entry = {
      status: "registered",
      uid,
      checkpoint,
      time: new Date().toISOString(),
      hash,
      name: user.name,
    };

    scans.push(entry);
    broadcast(entry);

    res.json({ status: "ok", entry });
  } catch (err) {
    console.error("Error in /scan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================
// Register new user (with PIN)
// ======================
app.post('/registerUser', async (req, res) => {
  const { uid, name, aadhar, pin } = req.body;

  if (!uid || !name || !aadhar || !pin) {
    return res.status(400).json({ error: 'Missing uid, name, aadhar, or pin' });
  }

 function convertBigIntToString(obj) {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

const receipt = await registerUser(uid, aadhar, name);
const serialized = convertBigIntToString(receipt);


    console.log(`✅ User registered: ${uid} - ${name} - Aadhar: ${aadhar} - PIN set`);

    const entry = {
      status: "registered",
      uid,
      checkpoint: "N/A",
      time: new Date().toISOString(),
      name,
      hash: "N/A",
    };
    scans.push(entry);
    broadcast(entry);

    res.json({ status: 'ok', receipt: serialized });
  }
   catch (err) {
    console.error('Error in /registerUser:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// ======================
// Verify user with PIN → issue token
// ======================
app.post('/verifyUser', async (req, res) => {
  const { uid, pin } = req.body;

  if (!uid || !pin) {
    return res.status(400).json({ error: "Missing uid or pin" });
  }

  try {
    const user = await getUser(uid);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ⚠️ For now, PIN checking is dummy (not stored on-chain)
    if (user.pin && user.pin !== pin) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    const token = jwt.sign({ uid }, JWT_SECRET, { expiresIn: "10m" }); // token valid 10 min
    activeTokens[uid] = token;

    res.json({ status: "ok", token });
  } catch (err) {
    console.error("Error in /verifyUser:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ======================
// Revoke token
// ======================
app.post('/revoke', (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  delete activeTokens[uid];
  res.json({ status: "ok", message: `Token revoked for UID ${uid}` });
});

// ======================
// Get stats
// ======================
app.get('/stats', (req, res) => {
  const stats = {};
  scans.slice(-100).forEach((s) => {
    stats[s.checkpoint] = (stats[s.checkpoint] || 0) + 1;
  });
  res.json(stats);
});

// ======================
// Start server
// ======================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
app.get("/", (req, res) => {
  res.send("✅ Temple Access API is running!");
});

