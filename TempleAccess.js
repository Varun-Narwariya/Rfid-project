// TempleAccess.js
const { ethers } = require("ethers");
require("dotenv").config();

// ====== Setup Blockchain Connection ======
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Ensure your private key is correct and does not have 0x prefix issues
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const TempleAccessABI = require("./TempleAccessABI.json");

const contract = new ethers.Contract(CONTRACT_ADDRESS, TempleAccessABI, wallet);

// ===== Helper: Convert UID to bytes32 =====

function uidToBytes32(uid) {
  // Normalize input
  if (typeof uid !== "string") uid = String(uid);

  // Remove any 0x prefix if present
  if (uid.startsWith("0x")) uid = uid.slice(2);

  // Validate it's hexadecimal
  if (!/^[0-9a-fA-F]+$/.test(uid)) {
    throw new Error(`Invalid UID: ${uid} (must be hex string)`);
  }

  // Pad to 32 bytes (64 hex chars)
  return "0x" + uid.padStart(64, "0");
}


// ===== Register a User =====
async function registerUser(uid, aadhaar, name, durationSeconds) {
  try {
    const uidBytes32 = uidToBytes32(uid);

    // Hash Aadhaar to bytes32
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

// ===== Revoke User =====
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

// ===== Log Checkpoint Scan =====
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

// ===== Get User Details =====
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
      remainingSeconds,
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
      expiryTime,
      remainingSeconds: remaining,
      remainingFormatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
  } catch (err) {
    console.error("❌ getUser error:", err);
    return { success: false, error: err.message };
  }
}

// ===== Register Device =====
async function registerDevice(deviceId, name, location) {
  try {
    const deviceBytes32 = uidToBytes32(deviceId);
    const tx = await contract.registerDevice(deviceBytes32, name, location);
    await tx.wait();

    console.log(`✅ Device registered: ${name} (${deviceId})`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ registerDevice error:", err);
    throw err;
  }
}

// ===== Revoke Device =====
async function revokeDevice(deviceId) {
  try {
    const deviceBytes32 = uidToBytes32(deviceId);
    const tx = await contract.revokeDevice(deviceBytes32);
    await tx.wait();

    console.log(`🚫 Device revoked: ${deviceId}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ revokeDevice error:", err);
    throw err;
  }
}

// ===== Log Device Data Share =====
async function logDeviceDataShare(fromDevice, toDevice, uid, dataURI) {
  try {
    const fromBytes32 = uidToBytes32(fromDevice);
    const toBytes32 = uidToBytes32(toDevice);
    const uidBytes32 = uidToBytes32(uid);

    const tx = await contract.logDeviceDataShare(fromBytes32, toBytes32, uidBytes32, dataURI);
    await tx.wait();

    console.log(`🔁 Data shared from ${fromDevice} ➜ ${toDevice}`);
    return { success: true, txHash: tx.hash };
  } catch (err) {
    console.error("❌ logDeviceDataShare error:", err);
    throw err;
  }
}


module.exports = { registerUser, revokeUser, logScan, getUser, registerDevice, revokeDevice, logDeviceDataShare };
