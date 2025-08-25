const CONNECTED_CALLBACK = "$connectedCallback";
export async function connectedCallback(target, prop, receiver, handler) {
    const callback = Reflect.get(target, CONNECTED_CALLBACK);
    if (typeof callback === "function") {
        await callback.call(receiver);
    }
}
