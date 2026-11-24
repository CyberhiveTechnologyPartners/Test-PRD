const http = require("node:http");
const fs = require("node:fs");
const crypto = require("node:crypto");

const USERS = "/tmp/hive-dast-users.json";
const sessions = new Set();
const users = () => {
  try { return JSON.parse(fs.readFileSync(USERS, "utf8")); } catch { return {}; }
};
const sessionOf = (req) => /(?:^|; )sid=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];

http.createServer((req, res) => {
  const path = req.url.split("?")[0];
  if (req.method === "POST" && path === "/api/login") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      let input = {};
      try { input = JSON.parse(body); } catch {}
      if (!input.email || users()[input.email] !== input.password) {
        res.writeHead(401);
        return res.end("wrong login");
      }
      const id = crypto.randomBytes(24).toString("hex");
      sessions.add(id);
      res.writeHead(200, { "Set-Cookie": `sid=${id}; Path=/; HttpOnly` });
      res.end("ok");
    });
    return;
  }
  if (path === "/logout") {
    sessions.delete(sessionOf(req));
    return res.end("logged out");
  }
  if (path.startsWith("/api/")) {
    if (!sessions.has(sessionOf(req))) {
      res.writeHead(401);
      return res.end("login required");
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end('{"user":"test"}');
  }
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end('<h1>Public page</h1><a href="/api/me">Account</a>');
}).listen(3000, "127.0.0.1");
