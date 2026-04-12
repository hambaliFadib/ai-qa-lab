const http = require("http");
const { URL } = require("url");

const PAGE_ID = "F041E484B908C3FC34E7FCBC4FDCF5C8";

// First get the webSocketDebuggerUrl for this specific page
const options = {
  hostname: "127.0.0.1",
  port: 9222,
  path: "/json/list",
  method: "GET"
};

const req = http.request(options, (res) => {
  let body = "";
  res.on("data", (chunk) => { body += chunk; });
  res.on("end", () => {
    try {
      const targets = JSON.parse(body);
      const page = targets.find(t => t.id === PAGE_ID);
      if (page) {
        console.log("Page found:");
        console.log("webSocketDebuggerUrl:", page.webSocketDebuggerUrl);
      }
    } catch (e) {
      console.log("Error:", e.message);
    }
  });
});

req.on("error", (e) => {
  console.error("Error:", e.message);
});

req.end();