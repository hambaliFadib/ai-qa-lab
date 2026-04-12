const http = require("http");

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
      const page = targets.find(t => t.url.includes("billing-item"));
      if (page) {
        console.log("Found Transaction Mapping page:");
        console.log("ID:", page.id);
        console.log("Title:", page.title);
        console.log("URL:", page.url);
        
        // Get the webSocketDebuggerUrl for this page
        console.log("\n--- Getting page content via CDP ---");
      } else {
        console.log("Page not found");
      }
    } catch (e) {
      console.log("Parse error:", e.message);
    }
  });
});

req.on("error", (e) => {
  console.error("Request error:", e.message);
});

req.end();