import http from "node:http";

const host = "127.0.0.1";
const port = 55431;

const server = http.createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.url === "/health") {
    response.writeHead(200);
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (request.url?.startsWith("/auth/v1/user")) {
    response.writeHead(401);
    response.end(JSON.stringify({ message: "Auth session missing" }));
    return;
  }

  response.writeHead(404);
  response.end(JSON.stringify({ message: "Not found" }));
});

server.listen(port, host, () => {
  process.stdout.write(`Mock Supabase listening on http://${host}:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
