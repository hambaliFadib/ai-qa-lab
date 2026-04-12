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
      console.log("--- CDP Pages ---");
      targets.forEach(t => {
        console.log(`\nTitle: ${t.title}`);
        console.log(`URL: ${t.url}`);
        console.log(`ID: ${t.id}`);
      });
    } catch (e) {
      console.log("Parse error:", e.message);
      console.log("Body:", body);
    }
  });
});

req.on("error", (e) => {
  console.error("Request error:", e.message);
});

req.end();