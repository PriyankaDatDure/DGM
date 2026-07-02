import fs from "fs";
import net from "net";
import path from "path";
import { Client } from "ssh2";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found. Copy .env.example to .env.local and fill in values.");
  }
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local`);
  return value;
}

loadEnvLocal();

const sshHost = requireEnv("SSH_HOST");
const sshUser = requireEnv("SSH_USER");
const sshPort = Number(process.env.SSH_PORT ?? 22);
const localPort = Number(process.env.SSH_LOCAL_PORT ?? process.env.DATABASE_PORT ?? 5433);
const remoteDbHost = process.env.SSH_REMOTE_DB_HOST ?? "127.0.0.1";
const remoteDbPort = Number(process.env.SSH_REMOTE_DB_PORT ?? process.env.DATABASE_PORT ?? 5433);
const reconnectMs = Number(process.env.SSH_RECONNECT_MS ?? 5000);

const connectConfig = {
  host: sshHost,
  port: sshPort,
  username: sshUser,
  keepaliveInterval: 30_000,
  keepaliveCountMax: 3,
};

if (process.env.SSH_KEY_PATH) {
  connectConfig.privateKey = fs.readFileSync(path.resolve(process.env.SSH_KEY_PATH));
  if (process.env.SSH_KEY_PASSPHRASE) {
    connectConfig.passphrase = process.env.SSH_KEY_PASSPHRASE;
  }
} else if (process.env.SSH_PASSWORD) {
  connectConfig.password = process.env.SSH_PASSWORD;
} else {
  throw new Error("Set SSH_PASSWORD or SSH_KEY_PATH in .env.local");
}

let shuttingDown = false;
let localServer = null;
let reconnectTimer = null;

function startTunnel() {
  const conn = new Client();

  conn.on("ready", () => {
    if (localServer) {
      localServer.close();
      localServer = null;
    }

    localServer = net.createServer((socket) => {
      conn.forwardOut(
        socket.remoteAddress ?? "127.0.0.1",
        socket.remotePort ?? 0,
        remoteDbHost,
        remoteDbPort,
        (err, stream) => {
          if (err) {
            console.error("Forward error:", err.message);
            socket.destroy();
            return;
          }
          socket.pipe(stream).pipe(socket);
        }
      );
    });

    localServer.listen(localPort, "127.0.0.1", () => {
      console.log("SSH tunnel active");
      console.log(`  local:  127.0.0.1:${localPort}`);
      console.log(`  remote: ${remoteDbHost}:${remoteDbPort} via ${sshUser}@${sshHost}:${sshPort}`);
      console.log("");
      console.log("Keep this terminal open. Press Ctrl+C to stop.");
    });

    localServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${localPort} is already in use. Stop the other tunnel or change SSH_LOCAL_PORT.`);
        process.exit(1);
      }
      console.error("Tunnel server error:", err.message);
    });
  });

  conn.on("error", (err) => {
    if (shuttingDown) return;
    console.error("SSH error:", err.message);
    scheduleReconnect();
  });

  conn.on("close", () => {
    if (shuttingDown) return;
    console.warn("SSH session closed — reconnecting…");
    scheduleReconnect();
  });

  conn.connect(connectConfig);
  return conn;
}

let conn = startTunnel();

function scheduleReconnect() {
  if (shuttingDown || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (shuttingDown) return;
    console.log(`Reconnecting in ${reconnectMs / 1000}s…`);
    conn = startTunnel();
  }, reconnectMs);
}

process.on("SIGINT", () => {
  shuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  console.log("\nClosing tunnel…");
  conn.end();
  if (localServer) localServer.close();
  process.exit(0);
});
