export function setCacheable(handler, callback) {
    handler.cacheable = true;
    handler.cache = {};
    try {
        callback();
    }
    finally {
        handler.cacheable = false;
    }
}
