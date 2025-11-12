require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { ethers } = require("ethers");
const { registerUser, revokeUser, logScan, getUser, registerDevice, revokeDevice, logDeviceDataShare} = require("./TempleAccess");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const TempleAccessABI = require("./TempleAccessABI.json");
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(CONTRACT_ADDRESS, TempleAccessABI, wallet);
// ======================
// ✅ File persistence setup (Fixed)
// ======================
const DATA_FILE = path.resolve(process.cwd(), "registeredUsers.json");

let registeredUsers = [];

// 🧩 Load existing data
try {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
    console.log("🆕 created registeredUsers.json file");
  }

  const fileData = fs.readFileSync(DATA_FILE, "utf8");
  registeredUsers = JSON.parse(fileData || "[]");

  // 🧹 Remove expired users on startup
  const now = Math.floor(Date.now() / 1000);
  const beforeCleanup = registeredUsers.length;
  registeredUsers = registeredUsers.filter(
    (u) => !u.journeyExpiry || u.journeyExpiry > now
  );

  if (registeredUsers.length !== beforeCleanup) {
    console.log("🧹 Cleaned up expired users on startup");
    fs.writeFileSync(DATA_FILE, JSON.stringify(registeredUsers, null, 2), "utf8");
  }

  console.log(`✅ Loaded ${registeredUsers.length} registered users from file`);
} catch (err) {
  console.error("❌ Failed to load registeredUsers.json:", err);
  registeredUsers = [];
}

// 💾 Save helper
function saveRegisteredUsers() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(registeredUsers, null, 2), "utf8");
    console.log("💾 registeredUsers.json saved");
  } catch (err) {
    console.error("❌ Error saving registered users:", err);
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
// SSE (Server-Sent Events)
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

// ======================
// ⏳ Auto-revoke expired users every 60s
// ======================
setInterval(async () => {
  const now = Math.floor(Date.now() / 1000);
  const expiredUsers = registeredUsers.filter((u) => u.journeyExpiry && u.journeyExpiry < now);

  if (expiredUsers.length > 0) {
    console.log("⏳ Auto-revoking expired users:", expiredUsers.map((u) => u.uid));

    for (const user of expiredUsers) {
      try {
        await revokeUser(user.uid); // revoke on blockchain
      } catch (err) {
        console.warn(`⚠️ Failed to revoke ${user.uid} on-chain:`, err.message);
      }

      registeredUsers = registeredUsers.filter((u) => u.uid !== user.uid);
      broadcast({
        uid: user.uid,
        status: "revoked",
        reason: "expired",
        time: new Date().toISOString(),
      });
    }

    saveRegisteredUsers();
  }
}, 60000);

// ======================
// ⚠️ Emergency Broadcast Endpoint
// ======================
app.post("/trigger-emergency", (req, res) => {
  const { message, level } = req.body;
  const alert = {
    type: "emergency",
    message: message || "⚠️ Emergency alert — Please follow safety protocol!",
    level: level || "critical",
    time: new Date().toISOString(),
  };

  console.log("🚨 Broadcasting EMERGENCY ALERT:", alert.message);
  broadcast(alert);
  res.json({ status: "ok", alert });
});

// ======================
// 📡 ESP32 sends scan
// ======================
app.post("/scan", async (req, res) => {
  console.log("📥 Received scan request:", req.body);
  const { uid, deviceId, checkpoint } = req.body;

  if (!uid || checkpoint === undefined)
    return res.status(400).json({ error: "Missing uid or checkpoint" });

  try {
    // --- 0️⃣ Normalize types ---
    const cpNum = Number(checkpoint);

    // --- 1️⃣ Query on-chain user data ---
    // getUser is your helper that reads from the contract
    const user = await getUser(uid); // may return object or "not found" sentinel

    // --- 2️⃣ Not Registered (on-chain) ---
    // your previous logic checked aadhaarHash for zero-value
    if (!user || user.aadhaarHash === "0x" + "0".repeat(64)) {
      // Add to pendingUsers only once
      if (!pendingUsers.some((p) => p.uid === uid)) {
        const payload = {
          status: "not_registered",
          uid,
          checkpoint: cpNum,
          deviceId,
          time: new Date().toISOString(),
        };
        pendingUsers.push(payload);
        scans.push(payload);
        broadcast(payload);
      }
      return res.json({ error: "UID not registered", status: "not_registered" });
    }

    // --- 3️⃣ Local expiry check (from registeredUsers.json) ---
    // Your app stores off-chain journeyExpiry in registeredUsers[]
    const localEntry = registeredUsers.find((u) => u.uid === uid);
    if (localEntry && localEntry.journeyExpiry) {
      const now = Math.floor(Date.now() / 1000);
      if (Number(localEntry.journeyExpiry) < now) {
        const payload = {
          status: "expired",
          uid,
          name: user.name || localEntry.name,
          checkpoint: cpNum,
          deviceId,
          time: new Date().toISOString(),
        };
        scans.push(payload);
        broadcast(payload);
        return res.status(403).json({ error: "Journey expired", payload });
      }
    }

    // --- 4️⃣ User inactive check (on-chain) ---
    if (user.active === false || user.active === "false") {
      const payload = {
        status: "inactive",
        uid,
        name: user.name,
        checkpoint: cpNum,
        deviceId,
        time: new Date().toISOString(),
      };
      scans.push(payload);
      broadcast(payload);
      return res.status(403).json({ error: "User inactive", payload });
    }

    // --- 5️⃣ Duplicate-scan / Already scanned at this checkpoint ---
    // Note: ensure numeric comparison
    const lastCp = Number(user.lastCheckpoint || 0);
    if (lastCp === cpNum) {
      return res.json({
        status: "ok",
        message: `Already scanned at checkpoint ${cpNum}`,
        uid,
        name: user.name,
        checkpoint: cpNum,
      });
    }

    // --- 6️⃣ Sequential check: only allow lastCheckpoint + 1 ---
    const expected = lastCp + 1;
    if (cpNum !== expected) {
      // Suspect movement (out-of-order)
      const payload = {
        status: "suspect",
        uid,
        name: user.name,
        from: lastCp,
        attempted: cpNum,
        expected,
        deviceId,
        time: new Date().toISOString(),
      };
      scans.push(payload);
      broadcast(payload);

      // Optionally record an off-chain flag here (DB or file)
      return res.status(403).json({
        error: "Non-sequential checkpoint",
        message: `Expected ${expected}, got ${cpNum}`,
        payload,
      });
    }

    // --- 7️⃣ Valid: call on-chain logScan to move user forward ---
    // logScan should update on-chain lastCheckpoint and checkpoint counters
    let receipt;
    try {
      receipt = await logScan(uid, cpNum); // your wrapper should return tx receipt or tx object
    } catch (chainErr) {
      console.error("❌ logScan on-chain failed:", chainErr);
      // Broadcast failure but do not assume state changed
      const payload = {
        status: "chain_error",
        uid,
        name: user.name,
        checkpoint: cpNum,
        deviceId,
        time: new Date().toISOString(),
        error: chainErr.message || String(chainErr),
      };
      scans.push(payload);
      broadcast(payload);
      return res.status(500).json({ error: "On-chain logging failed", details: chainErr.message });
    }

    // --- 8️⃣ Build entry and broadcast ---
    const entry = {
      status: "registered",
      uid,
      name: user.name,
      from: lastCp,
      to: cpNum,
      checkpoint: cpNum,
      deviceId,
      time: new Date().toISOString(),
      tx: receipt && (receipt.transactionHash || receipt.hash || receipt.txHash),
    };

    scans.push(entry);
    broadcast(entry);

    // --- 9️⃣ Return response (with BigInt-safe serialization) ---
    res.json({ status: "ok", entry, receipt: serializeBigInt(receipt) });
  } catch (err) {
    console.error("Error in /scan:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});




// ======================
// 👤 Admin registers new user
// ======================
app.post("/registerUser", async (req, res) => {
  const { uid, name, aadhar, journeyTime } = req.body;
  if (!uid || !name || !aadhar || !journeyTime)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const existing = await getUser(uid);
    if (existing && existing.aadhaarHash !== "0x" + "0".repeat(64)) {
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

    registeredUsers.push(entry);
    saveRegisteredUsers();

    pendingUsers = pendingUsers.filter((u) => u.uid !== uid);

    broadcast({ status: "registered", uid, name, journeyExpiry: expiry, time: entry.time });

    res.json({ status: "ok", entry, receipt: serializeBigInt(receipt) });
  } catch (err) {
    console.error("Error in /registerUser:", err);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// ======================
// ❌ Revoke user
// ======================
app.post("/revoke", async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  try {
    await revokeUser(uid);
    registeredUsers = registeredUsers.filter((u) => u.uid !== uid);
    saveRegisteredUsers();

    broadcast({ uid, status: "revoked", timestamp: Date.now() });
    res.json({ status: "ok" });
  } catch (err) {
    console.error("Revoke failed:", err);
    res.status(500).json({ error: "Revoke failed", details: err.message });
  }
});

// ======================
// 📟 Device Management
// ======================
app.post("/registerDevice", async (req, res) => {
  const { deviceId, name, location } = req.body;
  if (!deviceId || !name || !location)
    return res.status(400).json({ error: "Missing deviceId, name, or location" });

  try {
    const { registerDevice } = require("./TempleAccess");
    const receipt = await registerDevice(deviceId, name, location);
    res.json({ status: "ok", deviceId, name, location, receipt });
  } catch (err) {
    console.error("Error registering device:", err);
    res.status(500).json({ error: "Failed to register device", details: err.message });
  }
});

app.post("/revokeDevice", async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });

  try {
    const { revokeDevice } = require("./TempleAccess");
    const receipt = await revokeDevice(deviceId);
    res.json({ status: "ok", deviceId, receipt });
  } catch (err) {
    console.error("Error revoking device:", err);
    res.status(500).json({ error: "Failed to revoke device", details: err.message });
  }
});

app.get("/getDevice/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await contract.getDevice(deviceId); // Make sure getDevice() exists in your contract

    res.json({
      name: device.name,
      active: device.active,
      location: device.location
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch device", details: err.reason || err.message });
  }
});


app.post("/shareData", async (req, res) => {
  const { fromDevice, toDevice, uid, dataURI } = req.body;
  if (!fromDevice || !toDevice || !uid || !dataURI)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const { logDeviceDataShare } = require("./TempleAccess");
    const receipt = await logDeviceDataShare(fromDevice, toDevice, uid, dataURI);
    res.json({ status: "ok", receipt });
  } catch (err) {
    console.error("Error sharing data:", err);
    res.status(500).json({ error: "Failed to log data share", details: err.message });
  }
});


// ======================
// 📋 Pending users
// ======================
app.get("/pending", (req, res) => res.json(pendingUsers));
app.post("/pending/clear", (req, res) => {
  const { uid } = req.body;
  pendingUsers = pendingUsers.filter((u) => u.uid !== uid);
  res.json({ status: "cleared", uid });
});

// ======================
// 📢 Manual broadcast
// ======================
app.post("/broadcast", (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  const alert = { type: "broadcast", message, timestamp: new Date().toISOString() };
  broadcast(alert);
  console.log("📢 Broadcast sent:", message);

  res.json({ status: "ok", alert });
});

// ======================
// 📜 Registered users endpoint
// ======================
app.get("/registered", (req, res) => res.json(registeredUsers));

// ======================
// 📊 Stats and checkpoints
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
  const users = scans.filter((s) => s.checkpoint === req.params.id && s.status === "registered");
  res.json(users);
});

// ======================
// 🧑‍💼 Local Admin Management
// ======================
const {
  addLocalAdmin,
  revokeLocalAdmin,
  getLocalAdmin,
  addCheckpointDevice,
  revokeCheckpointDevice,
  getCheckpointDevice
} = require("./TempleAccess");

// ➕ Add Local Admin
app.post("/addLocalAdmin", async (req, res) => {
  const { adminAddress, checkpoint } = req.body;
  if (!adminAddress || checkpoint === undefined)
    return res.status(400).json({ error: "Missing adminAddress or checkpoint" });

  try {
    const result = await addLocalAdmin(adminAddress, Number(checkpoint));
    res.json({ status: "ok", txHash: result.txHash || result.hash, adminAddress, checkpoint });
  } catch (err) {
    console.error("❌ Error adding local admin:", err);
    res.status(500).json({ error: "Failed to add local admin", details: err.message });
  }
});

// ❌ Revoke Local Admin
app.post("/revokeLocalAdmin", async (req, res) => {
  const { adminAddress } = req.body;
  if (!adminAddress)
    return res.status(400).json({ error: "Missing adminAddress" });

  try {
    const result = await revokeLocalAdmin(adminAddress);
    res.json({ status: "ok", txHash: result.txHash || result.hash, adminAddress });
  } catch (err) {
    console.error("❌ Error revoking local admin:", err);
    res.status(500).json({ error: "Failed to revoke local admin", details: err.message });
  }
});

// 📋 Get Local Admin Info
app.get("/getLocalAdmin/:address", async (req, res) => {
  try {
    const adminInfo = await getLocalAdmin(req.params.address);
    res.json(adminInfo);
  } catch (err) {
    console.error("❌ Error getting local admin info:", err);
    res.status(500).json({ error: "Failed to fetch admin info", details: err.message });
  }
});

// ======================
// ⚙️ Checkpoint Device Management (ESP32)
// ======================

// ➕ Add Checkpoint Device
app.post("/addCheckpointDevice", async (req, res) => {
  const { deviceAddress, checkpoint } = req.body;
  if (!deviceAddress || checkpoint === undefined)
    return res.status(400).json({ error: "Missing deviceAddress or checkpoint" });

  try {
    const result = await addCheckpointDevice(deviceAddress, Number(checkpoint));
    res.json({ status: "ok", txHash: result.txHash || result.hash, deviceAddress, checkpoint });
  } catch (err) {
    console.error("❌ Error adding checkpoint device:", err);
    res.status(500).json({ error: "Failed to add checkpoint device", details: err.message });
  }
});

// ❌ Revoke Checkpoint Device
app.post("/revokeCheckpointDevice", async (req, res) => {
  const { deviceAddress } = req.body;
  if (!deviceAddress)
    return res.status(400).json({ error: "Missing deviceAddress" });

  try {
    const result = await revokeCheckpointDevice(deviceAddress);
    res.json({ status: "ok", txHash: result.txHash || result.hash, deviceAddress });
  } catch (err) {
    console.error("❌ Error revoking checkpoint device:", err);
    res.status(500).json({ error: "Failed to revoke checkpoint device", details: err.message });
  }
});

// 📋 Get Checkpoint Device Info
app.get("/getCheckpointDevice/:address", async (req, res) => {
  try {
    const info = await getCheckpointDevice(req.params.address);
    res.json(info);
  } catch (err) {
    console.error("❌ Error getting checkpoint device info:", err);
    res.status(500).json({ error: "Failed to fetch checkpoint device info", details: err.message });
  }
});

// ======================
// 🧠 Role Detection (Frontend helper)
// ======================
app.get("/detectRole/:address", async (req, res) => {
  try {
    const address = req.params.address;
    const owner = await contract.owner();

    if (address.toLowerCase() === owner.toLowerCase()) {
      return res.json({ role: "owner", checkpoint: "N/A" });
    }

    const localAdmin = await getLocalAdmin(address);
    if (localAdmin && localAdmin.active) {
      return res.json({ role: "local_admin", checkpoint: localAdmin.checkpoint });
    }

    const checkpointDevice = await getCheckpointDevice(address);
    if (checkpointDevice && checkpointDevice.active) {
      return res.json({ role: "checkpoint_device", checkpoint: checkpointDevice.checkpoint });
    }

    return res.json({ role: "unauthorized" });
  } catch (err) {
    console.error("❌ Error detecting role:", err);
    res.status(500).json({ error: "Failed to detect role", details: err.message });
  }
});


// ======================
// 🩺 Health Check
// ======================
app.get("/", (req, res) => res.send("✅ Temple Access API is running!"));

// ======================
// 🚀 Start Server
// ======================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
