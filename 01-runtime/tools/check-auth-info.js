const path = require("path");
const { paths, readJsonIfExists } = require("./workspace-paths");

// Check the auth state file
const authState = readJsonIfExists(paths.authStateFile);
if (authState) {
  console.log("=== Auth State ===");
  console.log("Cookies:", authState.cookies.map(c => c.name).join(", "));
  
  // Check token
  const tokenLs = authState.origins.find(o => o.origin === "https://dev-energy.pgn.co.id")?.localStorage.find(ls => ls.name === "token");
  if (tokenLs) {
    try {
      const tokenData = JSON.parse(tokenLs.value);
      console.log("\n=== Token Info ===");
      console.log("Username:", tokenData.username);
      console.log("Expires:", tokenData.dateExpired);
      console.log("User Level:", tokenData.userLevel);
    } catch(e) {
      console.log("Token parse error:", e.message);
    }
  }
} else {
  console.log("No auth state found");
}

// Check current time
console.log("\n=== Current Time ===");
console.log(new Date().toISOString());

// Check file modification time
const fs = require("fs");
const authPath = paths.authStateFile;
if (fs.existsSync(authPath)) {
  const stats = fs.statSync(authPath);
  console.log("\n=== Auth File ===");
  console.log("Modified:", stats.mtime.toISOString());
  console.log("Age (ms):", Date.now() - stats.mtime.getTime());
  console.log("Age (hours):", (Date.now() - stats.mtime.getTime()) / 3600000);
}