const isDev = process.env.NODE_ENV === "development";

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  scope: string;
  message: string;
  durationMs?: number;
  meta?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const ts = new Date().toISOString().slice(11, 23);
  const dur = entry.durationMs != null ? ` (${entry.durationMs}ms)` : "";
  const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : "";
  return `[${ts}] [${entry.level.toUpperCase()}] [${entry.scope}] ${entry.message}${dur}${meta}`;
}

function log(entry: LogEntry) {
  if (!isDev) return;
  const msg = formatEntry(entry);
  switch (entry.level) {
    case "error":
      console.error(msg);
      break;
    case "warn":
      console.warn(msg);
      break;
    default:
      console.log(msg);
  }
}

export function createLogger(scope: string) {
  return {
    info(message: string, meta?: Record<string, unknown>) {
      log({ level: "info", scope, message, meta });
    },
    warn(message: string, meta?: Record<string, unknown>) {
      log({ level: "warn", scope, message, meta });
    },
    error(message: string, meta?: Record<string, unknown>) {
      log({ level: "error", scope, message, meta });
    },
    timed(message: string) {
      const start = Date.now();
      return {
        end(meta?: Record<string, unknown>) {
          const durationMs = Date.now() - start;
          log({ level: "info", scope, message, durationMs, meta });
          return durationMs;
        },
      };
    },
  };
}
