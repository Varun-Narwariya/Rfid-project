import dotenv from "dotenv";
import { getUser } from "./TempleAccess.js";

dotenv.config();

async function main() {
  const testUid = "123456"; // replace with a UID you know exists
  const user = await getUser(testUid);

  if (user) {
    console.log("✅ User found on blockchain:");
    console.log("UID:", testUid);
    console.log("Name:", user.name);
    console.log("Aadhaar hash:", user.aadhaarHash);
  } else {
    console.log("⚠️ User not found on blockchain for UID:", testUid);
  }
}

main();
