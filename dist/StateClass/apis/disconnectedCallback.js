const DISCONNECTED_CALLBACK = "$disconnectedCallback";
export async function disconnectedCallback(target, prop, receiver, handler) {
    const callback = Reflect.get(target, DISCONNECTED_CALLBACK);
    if (typeof callback === "function") {
        await callback.call(receiver);
    }
}
