/* TempleAccess.js
import Web3 from "web3";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// =======================
// Setup Web3 and Wallet
// =======================
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
  )
);

// Correct way to add your private key in ESM
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

// Load contract ABI & instance
const abi = JSON.parse(fs.readFileSync("./TempleAccessABI.json", "utf-8"));
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(abi, contractAddress);

// =======================
// Helper: string -> bytes32
// =======================
export function toBytes32(text) {
  return web3.utils.padRight(web3.utils.asciiToHex(text), 64);
}

// =======================
// Get user info from blockchain
// =======================
export async function getUser(uid) {
  try {
    const uidBytes = toBytes32(uid);

    const [aadhaarHash, name] = await contract.methods.getUser(uidBytes).call();

    if (
      aadhaarHash ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      console.warn("User not found on blockchain");
      return null;
    }

    return { aadhaarHash, name };
  } catch (err) {
    console.error("getUser error:", err.message);
    return null;
  }
}

// =======================
// Register user (owner only)
// =======================
export async function registerUser(uid, aadhaar, name) {
  try {
    const uidBytes = toBytes32(uid);
    const aadhaarHash = web3.utils.keccak256(aadhaar);

    const tx = contract.methods.registerUser(uidBytes, aadhaarHash, name);
    const gas = await tx.estimateGas({ from: account.address });

    const receipt = await tx.send({ from: account.address, gas });
    console.log("✅ User registered tx hash:", receipt.transactionHash);
    return receipt;
  } catch (err) {
    console.error("registerUser error:", err.message);
    throw err;
  }
}
*/ 
// templeAccess.js

// templeAccess.js - handles all smart contract interactions
const Web3 = require('web3').default;
require('dotenv').config();
const abi = require('./TempleAccessABI.json');

const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY; // owner private key
const OWNER_ADDRESS = process.env.OWNER_ADDRESS;

const web3 = new Web3(RPC_URL);
const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);

// Helper: string -> bytes32
function stringToBytes32(str) {
    return web3.utils.rightPad(web3.utils.asciiToHex(str), 64);
}

// Get user by UID
async function getUser(uidStr) {
    const uid = stringToBytes32(uidStr);
    try {
        const user = await contract.methods.getUser(uid).call();
        return { aadhaarHash: user[0], name: user[1] };
    } catch (err) {
        return null; // user not found
    }
}

// Register user (owner only)
// Write (owner only): register user
// Register user (owner only)
async function registerUser(uidStr, aadhaarStr, name) {
    const uid = stringToBytes32(uidStr);
    const aadhaarHash = web3.utils.keccak256(aadhaarStr);  // ✅ HASH instead of bytes32

    const tx = contract.methods.registerUser(uid, aadhaarHash, name);

    const gas = await tx.estimateGas({ from: OWNER_ADDRESS });
    const gasPrice = await web3.eth.getGasPrice();

    const signedTx = await web3.eth.accounts.signTransaction(
        {
            to: CONTRACT_ADDRESS,
            data: tx.encodeABI(),
            gas,
            gasPrice,
            from: OWNER_ADDRESS
        },
        PRIVATE_KEY
    );

    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return {
        transactionHash: receipt.transactionHash,
        status: receipt.status,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString()
    };
}

    // ✅ Serialize BigInt fields to strings
    const serialized = {
        transactionHash: receipt.transactionHash,
        status: receipt.status,
        blockNumber: receipt.blockNumber?.toString(),
        gasUsed: receipt.gasUsed?.toString(),
        cumulativeGasUsed: receipt.cumulativeGasUsed?.toString(),
        contractAddress: receipt.contractAddress || null,
        events: receipt.events || {}
    };

    return serialized;



module.exports = { getUser, registerUser };
