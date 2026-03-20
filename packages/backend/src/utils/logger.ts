type Meta = Record<string, unknown>;

export function logInfo(message: string, meta: Meta = {}): void {
  console.log(JSON.stringify({ level: "info", message, ...meta, ts: new Date().toISOString() }));
}

export function logError(message: string, meta: Meta = {}): void {
  console.error(JSON.stringify({ level: "error", message, ...meta, ts: new Date().toISOString() }));
}
