// TempleAccess.js
const { ethers } = require("ethers");
require("dotenv").config();

// ====== Setup Blockchain Connection ======
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const TempleAccessABI = require("./TempleAccessABI.json");

const contract = new ethers.Contract(CONTRACT_ADDRESS, TempleAccessABI, wallet);

// =====================================================
// ============== Helper Functions =====================
// =====================================================

// ===== Convert UID or DeviceID to bytes32 =====
function uidToBytes32(uid) {
  if (typeof uid !== "string") uid = String(uid);
  if (uid.startsWith("0x")) uid = uid.slice(2);
  if (!/^[0-9a-fA-F]+$/.test(uid)) {
    throw new Error(`Invalid UID: ${uid} (must be hex string)`);
  }
  return "0x" + uid.padStart(64, "0");
}

// ===== Convert address to checksummed form =====
function normalizeAddress(addr) {
  try {
    return ethers.getAddress(addr);
  } catch {
    throw new Error(`Invalid address: ${addr}`);
  }
}

// =====================================================
// ============== User Functions =======================
// =====================================================

async function registerUser(uid, aadhaar, name, durationSeconds) {
  try {
    const uidBytes32 = uidToBytes32(uid);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(aadhaar));
    const tx = await contract.registerUser(uidBytes32, hash, name, durationSeconds);
    await tx.wait();

    console.log(`✅ User registered: ${name}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ registerUser error:", err);
    return { success: false, error: err.message };
  }
}

async function revokeUser(uid) {
  try {
    const uidBytes32 = uidToBytes32(uid);
    const tx = await contract.revokeUser(uidBytes32);
    await tx.wait();

    console.log(`🚫 User revoked: ${uid}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ revokeUser error:", err);
    return { success: false, error: err.message };
  }
}

async function logScan(uid, checkpoint) {
  try {
    const uidBytes32 = uidToBytes32(uid);
    const tx = await contract.logScan(uidBytes32, checkpoint);
    await tx.wait();

    console.log(`📍 Scan logged for UID: ${uid} at checkpoint: ${checkpoint}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ logScan error:", err);
    return { success: false, error: err.message };
  }
}

async function getUser(uid) {
  try {
    const uidBytes32 = uidToBytes32(uid);
    const [
      aadhaarHash,
      name,
      active,
      lastCheckpoint,
      lastScanTime,
      startTime,
      duration,
      registeredBy,
    ] = await contract.getUser(uidBytes32);

    const expiryTime = Number(startTime) + Number(duration);
    const now = Math.floor(Date.now() / 1000);
    const remaining = expiryTime > now ? expiryTime - now : 0;

    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return {
      aadhaarHash,
      name,
      active,
      lastCheckpoint,
      lastScanTime: Number(lastScanTime),
      startTime: Number(startTime),
      duration: Number(duration),
      registeredBy,
      remainingFormatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
  } catch (err) {
    console.error("❌ getUser error:", err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// ============== Device Functions =====================
// =====================================================

async function registerDevice(deviceId, name, location, checkpointNumber) {
  try {
    const deviceBytes32 = uidToBytes32(deviceId);
    const tx = await contract.registerDevice(deviceBytes32, name, location, checkpointNumber);
    await tx.wait();

    console.log(`✅ Device registered: ${name} (${deviceId}) at checkpoint ${checkpointNumber}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ registerDevice error:", err);
    return { success: false, error: err.message };
  }
}

async function revokeDevice(deviceId) {
  try {
    const deviceBytes32 = uidToBytes32(deviceId);
    const tx = await contract.revokeDevice(deviceBytes32);
    await tx.wait();

    console.log(`🚫 Device revoked: ${deviceId}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ revokeDevice error:", err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// ============== Local Admin Management ===============
// =====================================================

async function addLocalAdmin(adminAddr, checkpoint) {
  try {
    const addr = normalizeAddress(adminAddr);
    const tx = await contract.addLocalAdmin(addr, checkpoint);
    await tx.wait();

    console.log(`👤 Local Admin added: ${addr} for checkpoint ${checkpoint}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ addLocalAdmin error:", err);
    return { success: false, error: err.message };
  }
}

async function revokeLocalAdmin(adminAddr) {
  try {
    const addr = normalizeAddress(adminAddr);
    const tx = await contract.revokeLocalAdmin(addr);
    await tx.wait();

    console.log(`🛑 Local Admin revoked: ${addr}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ revokeLocalAdmin error:", err);
    return { success: false, error: err.message };
  }
}

async function getLocalAdmin(adminAddr) {
  try {
    const addr = normalizeAddress(adminAddr);
    const [active, checkpoint] = await contract.localAdmins(addr);

    return { address: addr, active, checkpoint: Number(checkpoint) };
  } catch (err) {
    console.error("❌ getLocalAdmin error:", err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// ============== Checkpoint Device Management =========
// =====================================================

async function addCheckpointDevice(deviceAddr, checkpoint) {
  try {
    const addr = normalizeAddress(deviceAddr);
    const tx = await contract.addCheckpointDevice(addr, checkpoint);
    await tx.wait();

    console.log(`⚙️ Checkpoint Device added: ${addr} for checkpoint ${checkpoint}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ addCheckpointDevice error:", err);
    return { success: false, error: err.message };
  }
}

async function revokeCheckpointDevice(deviceAddr) {
  try {
    const addr = normalizeAddress(deviceAddr);
    const tx = await contract.revokeCheckpointDevice(addr);
    await tx.wait();

    console.log(`🛑 Checkpoint Device revoked: ${addr}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ revokeCheckpointDevice error:", err);
    return { success: false, error: err.message };
  }
}

async function getCheckpointDevice(deviceAddr) {
  try {
    const addr = normalizeAddress(deviceAddr);
    const [active, checkpoint] = await contract.checkpointDevices(addr);

    return { address: addr, active, checkpoint: Number(checkpoint) };
  } catch (err) {
    console.error("❌ getCheckpointDevice error:", err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// ============== Exports ==============================
// =====================================================

module.exports = {
  // === Users ===
  registerUser,
  revokeUser,
  logScan,
  getUser,

  // === Devices ===
  registerDevice,
  revokeDevice,

  // === Local Admin ===
  addLocalAdmin,
  revokeLocalAdmin,
  getLocalAdmin,

  // === Checkpoint Device ===
  addCheckpointDevice,
  revokeCheckpointDevice,
  getCheckpointDevice,
};
