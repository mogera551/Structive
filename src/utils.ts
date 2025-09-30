export type StructiveErrorPayload = {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  hint?: string;
  docsUrl?: string;
  severity?: "error" | "warn";
  cause?: unknown;
};

export function raiseError(message: string): never;
export function raiseError(payload: StructiveErrorPayload): never;
export function raiseError(messageOrPayload: string | StructiveErrorPayload): never {
  if (typeof messageOrPayload === "string") {
    throw new Error(messageOrPayload);
  }
  const { message, code, context, hint, docsUrl, severity, cause } = messageOrPayload;
  const err = new Error(message);
  // 追加情報はプロパティとして付与（メッセージは既存互換のまま）
  (err as any).code = code;
  if (context) (err as any).context = context;
  if (hint) (err as any).hint = hint;
  if (docsUrl) (err as any).docsUrl = docsUrl;
  if (severity) (err as any).severity = severity;
  if (cause) (err as any).cause = cause;
  throw err;
}
