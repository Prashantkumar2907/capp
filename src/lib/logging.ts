type SafeLogValue = string | number | boolean | null | undefined;

export function safeServerLog(event: string, metadata: Record<string, SafeLogValue> = {}) {
  console.error(JSON.stringify({ event, at: new Date().toISOString(), ...metadata }));
}
