export async function setCacheable(handler, callback) {
    handler.cacheable = true;
    handler.cache = {};
    try {
        await callback();
    }
    finally {
        handler.cacheable = false;
    }
}
