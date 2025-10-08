require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { getUser, registerUser, revokeUser, logScan } = require("./TempleAccess");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ======================
// File persistence setup
// ======================
const DATA_FILE = path.join(__dirname, "registeredUsers.json");

// Load existing data (initialize file if needed)
let registeredUsers = [];
try {
  if (fs.existsSync(DATA_FILE)) {
    const fileData = fs.readFileSync(DATA_FILE, "utf8");
    registeredUsers = JSON.parse(fileData || "[]");
  } else {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }
} catch (err) {
  console.error("Failed to load registeredUsers.json:", err);
  registeredUsers = [];
}

// Helper to save registered users
function saveRegisteredUsers() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(registeredUsers, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving registered users:", err);
  }
}

// ======================
// In-memory state
// ======================
let scans = [];
let pendingUsers = [];
let clients = [];

// ======================
// BigInt-safe serializer
// ======================
function serializeBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === "object") {
    const res = {};
    for (const key in obj) {
      res[key] = serializeBigInt(obj[key]);
    }
    return res;
  }
  return obj;
}

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
  clients.forEach((res) => res.write(`data: ${JSON.stringify(data)}\n\n`));
}

setInterval(async () => {
  const now = Math.floor(Date.now() / 1000);
  const expiredUsers = registeredUsers.filter((u) => u.journeyExpiry && u.journeyExpiry < now);

  if (expiredUsers.length > 0) {
    console.log("⏳ Auto-revoking expired users:", expiredUsers.map(u => u.uid));

    for (const user of expiredUsers) {
      try {
        await revokeUser(user.uid); // revoke on-chain
      } catch (err) {
        console.warn(`Failed to revoke ${user.uid} on-chain:`, err.message);
      }

      registeredUsers = registeredUsers.filter((u) => u.uid !== user.uid);
      broadcast({ uid: user.uid, status: "revoked", reason: "expired", time: new Date().toISOString() });
    }

    saveRegisteredUsers();
  }
}, 60000);
// ======================
// ESP32 sends scan
// ======================
app.post("/scan", async (req, res) => {
  const { uid, checkpoint } = req.body;
  if (!uid || !checkpoint)
    return res.status(400).json({ error: "Missing uid or checkpoint" });

  try {
    const user = await getUser(uid);

    if (
      !user ||
      user.aadhaarHash ===
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      // ✅ Prevent duplicate pending entries
      if (!pendingUsers.some((p) => p.uid === uid)) {
        const payload = {
          status: "not_registered",
          uid,
          checkpoint,
          time: new Date().toISOString(),
        };
        pendingUsers.push(payload);
        scans.push(payload);
        broadcast(payload);
      }
      return res.json({ error: "UID not registered" });
    }

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

    res.json({ status: "ok", entry, receipt: serializeBigInt(receipt) });
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
  if (!uid || !name || !aadhar || !journeyTime)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const existing = await getUser(uid);
    if (
      existing &&
      existing.aadhaarHash !==
        "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return res.status(400).json({ error: "UID already registered" });
    }

    const expiry = Math.floor(Date.now() / 1000) + parseInt(journeyTime);
    const receipt = await registerUser(uid, aadhar, name, expiry);

    const entry = {
      status: "registered",
      uid,
      name,
      checkpoint: "N/A",
      journeyExpiry: expiry,
      time: new Date().toISOString(),
    };

    scans.push(entry);
    registeredUsers.push(entry);
    saveRegisteredUsers();

    // ✅ Remove from pending
    pendingUsers = pendingUsers.filter((u) => u.uid !== uid);

    // ✅ Broadcast event so PendingPage & RegisteredUsers update live
    broadcast({
      status: "registered",
      uid,
      name,
      journeyExpiry: expiry,
      time: entry.time,
    });

    res.json({ status: "ok", entry, receipt: serializeBigInt(receipt) });
  } catch (err) {
    console.error("Error in /registerUser:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// ======================
// Revoke user
// ======================
app.post("/revoke", async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  try {
    const receipt = await revokeUser(uid);

    // ✅ Remove from registered users list
    registeredUsers = registeredUsers.filter((u) => u.uid !== uid);
    saveRegisteredUsers();

    // ✅ Broadcast revoke event
    broadcast({
      uid,
      status: "revoked",
      timestamp: Date.now(),
    });

    res.json({ status: "ok", receipt: serializeBigInt(receipt) });
  } catch (err) {
    console.error("Revoke failed:", err);
    res.status(500).json({ error: "Revoke failed", details: err.message });
  }
});

// ======================
// Pending users
// ======================
app.get("/pending", (req, res) => res.json(pendingUsers));
app.post("/pending/clear", (req, res) => {
  const { uid } = req.body;
  pendingUsers = pendingUsers.filter((u) => u.uid !== uid);
  res.json({ status: "cleared", uid });
});

// ======================
// Registered users endpoint
// ======================
app.get("/registered", (req, res) => {
  res.json(registeredUsers);
});

// ======================
// Stats and checkpoints
// ======================
app.get("/stats", (req, res) => {
  const stats = {};
  scans.slice(-100).forEach((s) => {
    if (s.status === "registered")
      stats[s.checkpoint] = (stats[s.checkpoint] || 0) + 1;
  });
  res.json(stats);
});

app.get("/checkpoint/:id", (req, res) => {
  const users = scans.filter(
    (s) => s.checkpoint === req.params.id && s.status === "registered"
  );
  res.json(users);
});

// ======================
// Root health check
// ======================
app.get("/", (req, res) => res.send("✅ Temple Access API is running!"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
