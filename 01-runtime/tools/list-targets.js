const http = require("http");
const { URL } = require("url");

const versionUrl = "http://127.0.0.1:9222/json/version";

function getJson(targetUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const client = url.protocol === "https:" ? https : http;
    const request = client.get(url, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        if (response.statusCode >= 400) {
          reject(new Error(`Request failed with status ${response.statusCode}`));
          return;
        }
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.on("error", reject);
  });
}

async function main() {
  const version = await getJson(versionUrl);
  console.log(JSON.stringify(version, null, 2));
  
  // Get list of targets
  const targetsUrl = version.webSocketDebuggerUrl.replace("ws://", "http://").replace("/devtools/browser/", "/json/list");
  const targets = await getJson(targetsUrl);
  console.log("\n--- Pages ---");
  targets.forEach(t => {
    console.log(`- ${t.title}: ${t.url}`);
  });
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});