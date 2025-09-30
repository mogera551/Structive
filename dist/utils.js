export function raiseError(messageOrPayload) {
    if (typeof messageOrPayload === "string") {
        throw new Error(messageOrPayload);
    }
    const { message, code, context, hint, docsUrl, severity, cause } = messageOrPayload;
    const err = new Error(message);
    // 追加情報はプロパティとして付与（メッセージは既存互換のまま）
    err.code = code;
    if (context)
        err.context = context;
    if (hint)
        err.hint = hint;
    if (docsUrl)
        err.docsUrl = docsUrl;
    if (severity)
        err.severity = severity;
    if (cause)
        err.cause = cause;
    throw err;
}
