export function setCacheable(handler, callback) {
    handler.cache = new Map();
    try {
        callback();
    }
    finally {
        handler.cache = null;
    }
}
