require("dotenv").config();
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const {
  getUser,
  registerUser,
  revokeUser,
  logScan,
} = require("./TempleAccess"); // blockchain helpers

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ======================
// In-memory state
// ======================
let scans = [];       // All scan history (for stats)
let pending = [];     // Unregistered UIDs waiting for admin
let clients = [];     // SSE clients

// ======================
// SSE live updates
// ======================
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

function broadcast(data) {
  clients.forEach((res) =>
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  );
}
// Get pending list
app.get("/pending", (req, res) => {
  res.json(pending);
});


// ======================
// ESP32 sends scan
// ======================
app.post("/scan", async (req, res) => {
  const { uid, checkpoint } = req.body;
  if (!uid || !checkpoint) {
    return res.status(400).json({ error: "Missing uid or checkpoint" });
  }

  try {
    const user = await getUser(uid);

    if (
      !user ||
      user.aadhaarHash ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      // Not registered yet
      const payload = {
        status: "not_registered",
        uid,
        checkpoint,
        time: new Date().toISOString(),
      };
      pending.push(payload);
      scans.push(payload);
      broadcast(payload);
      return res.json({ error: "UID not registered" });
    }

    // Check if journey expired
    if (parseInt(user.journeyExpiry) < Date.now() / 1000) {
      const payload = {
        status: "expired",
        uid,
        name: user.name,
        checkpoint,
        time: new Date().toISOString(),
      };
      scans.push(payload);
      broadcast(payload);
      return res.status(403).json({ error: "Journey expired", payload });
    }

    // Registered → log checkpoint on blockchain
    const receipt = await logScan(uid, checkpoint);

    const entry = {
      status: "registered",
      uid,
      name: user.name,
      checkpoint,
      time: new Date().toISOString(),
      tx: receipt.transactionHash,
    };

    scans.push(entry);
    broadcast(entry);
    res.json({ status: "ok", entry });
  } catch (err) {
    console.error("Error in /scan:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ======================
// Admin registers new user
// ======================
app.post("/registerUser", async (req, res) => {
  const { uid, name, aadhar, journeyTime } = req.body;

  if (!uid || !name || !aadhar || !journeyTime) {
    return res
      .status(400)
      .json({ error: "Missing uid, name, aadhar, or journeyTime" });
  }

  try {
    const aadhaarHash = crypto
      .createHash("sha256")
      .update(aadhar)
      .digest("hex");

    // Convert journeyTime (seconds) into expiry timestamp
    const expiry = Math.floor(Date.now() / 1000) + parseInt(journeyTime);

    const receipt = await registerUser(uid, aadhaarHash, name, expiry);

    const entry = {
      status: "registered",
      uid,
      name,
      checkpoint: "N/A",
      journeyExpiry: expiry,
      time: new Date().toISOString(),
    };

    scans.push(entry);
    broadcast(entry);

    res.json({ status: "ok", receipt });
  } catch (err) {
    console.error("Error in /registerUser:", err);
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
});

// ======================
// Get user details
// ======================
app.get("/user/:uid", async (req, res) => {
  try {
    const uid = req.params.uid;
    const user = await getUser(uid);

    if (!user || !user.name) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      uid,
      name: user.name,
      aadhaarHash: user.aadhaarHash,
      active: user.active,
      lastCheckpoint: user.lastCheckpoint,
      lastScanTime: user.lastScanTime,
      journeyExpiry: user.journeyExpiry,
    });
  } catch (err) {
    console.error("Error in /user/:uid:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// ======================
// Revoke user (make card reusable)
// ======================
app.post("/revoke", async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  try {
    const receipt = await revokeUser(uid);
    res.json({ status: "ok", tx: receipt.transactionHash });
  } catch (err) {
    console.error("Error in /revoke:", err);
    res.status(500).json({ error: "Revoke failed", details: err.message });
  }
});

// ======================
// Checkpoint stats (counts only)
// ======================
app.get("/stats", (req, res) => {
  const stats = {};
  scans.slice(-100).forEach((s) => {
    if (s.status === "registered") {
      stats[s.checkpoint] = (stats[s.checkpoint] || 0) + 1;
    }
  });
  res.json(stats);
});

// ======================
// Get all users at a checkpoint
// ======================
app.get("/checkpoint/:id", (req, res) => {
  const { id } = req.params;
  const usersAtCheckpoint = scans.filter(
    (s) => s.checkpoint === id && s.status === "registered"
  );
  res.json(usersAtCheckpoint);
});

// ======================
// Root health check
// ======================
app.get("/", (req, res) =>
  res.send("✅ Temple Access API is running!")
);

// ======================
// Start server
// ======================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
let pendingUsers = []; // global in-memory store

// When an unregistered UID scans, push to pending
app.post("/unregistered", (req, res) => {
  const { uid, checkpoint, time } = req.body;

  // prevent duplicate pending UIDs
  const exists = pendingUsers.find(u => u.uid === uid);
  if (!exists) {
    pendingUsers.push({ uid, checkpoint, time });
  }
  
  res.json({ status: "added" });
});


// Endpoint to fetch pending list
app.get("/pending", (req, res) => {
  res.json(pendingUsers);
});

// Optional: clear once registered
app.post("/pending/clear", (req, res) => {
  const { uid } = req.body;
  pendingUsers = pendingUsers.filter((u) => u.uid !== uid);
  res.json({ status: "cleared", uid });
});
