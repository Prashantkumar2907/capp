import { spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const port = readPort(args) ?? process.env.PORT ?? "3000";
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "start", ...args], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

let sawReady = false;
let warming = false;
let buffered = "";

child.stdout.on("data", (chunk) => handleOutput(chunk, process.stdout));
child.stderr.on("data", (chunk) => handleOutput(chunk, process.stderr));

child.on("exit", (code, signal) => {
  if (buffered) {
    process.stdout.write(buffered);
    buffered = "";
  }
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

function handleOutput(chunk, stream) {
  const text = chunk.toString();

  if (warming) {
    buffered += text;
    return;
  }

  if (!sawReady) {
    buffered += text;
    if (/Ready in/.test(buffered)) {
      sawReady = true;
      warming = true;
      warmCriticalRoutes()
        .then((results) => {
          process.stdout.write(buffered);
          buffered = "";
          for (const result of results) {
            process.stdout.write(`- Warmed ${result.path} in ${Math.round(result.ms)}ms (${result.status})\n`);
          }
        })
        .catch((error) => {
          process.stdout.write(buffered);
          buffered = "";
          process.stderr.write(`- Warm-up skipped: ${error instanceof Error ? error.message : "unknown error"}\n`);
        })
        .finally(() => {
          warming = false;
        });
    }
    return;
  }

  stream.write(text);
}

async function warmCriticalRoutes() {
  const baseUrl = `http://127.0.0.1:${port}`;
  const warmups = publicMenuWarmups();
  const paths = [
    "/api/health",
    ...warmups.flatMap((input) => [
      `/api/public/menu?branchId=${input.branchId}&tableNumber=${input.tableNumber}`,
      `/api/public/menu/meta?branchId=${input.branchId}&tableNumber=${input.tableNumber}`,
    ]),
  ];

  return Promise.all(
    paths.map(async (pathName) => {
      const started = performance.now();
      const response = await fetch(`${baseUrl}${pathName}`, { cache: "no-store" });
      await response.arrayBuffer();
      return {
        path: pathName,
        status: response.status,
        ms: performance.now() - started,
      };
    })
  );
}

function publicMenuWarmups() {
  const configured = process.env.CAPP_PUBLIC_MENU_WARMUPS;
  const entries = configured ? configured.split(",") : ["b0000000-0000-0000-0000-000000000099:1"];

  return entries
    .map((entry) => {
      const [branchId, rawTableNumber] = entry.trim().split(":");
      const tableNumber = Number(rawTableNumber);
      if (!branchId || !Number.isInteger(tableNumber) || tableNumber <= 0) return null;
      return { branchId, tableNumber };
    })
    .filter(Boolean);
}

function readPort(values) {
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if ((value === "-p" || value === "--port") && values[index + 1]) return values[index + 1];
    if (value?.startsWith("--port=")) return value.slice("--port=".length);
  }
  return null;
}
