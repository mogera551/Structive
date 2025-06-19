export function setCacheable(handler, callback) {
    handler.cacheable = true;
    handler.cache = new Map();
    try {
        callback();
    }
    finally {
        handler.cacheable = false;
    }
}
