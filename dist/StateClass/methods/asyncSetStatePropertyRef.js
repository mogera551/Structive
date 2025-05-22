export async function asyncSetStatePropertyRef(handler, info, listIndex, callback) {
    handler.structuredPathInfoStack.push(info);
    handler.listIndexStack.push(listIndex);
    try {
        await callback();
    }
    finally {
        handler.structuredPathInfoStack.pop();
        handler.listIndexStack.pop();
    }
}
