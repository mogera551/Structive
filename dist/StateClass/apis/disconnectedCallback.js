const DISCONNECTED_CALLBACK = "$disconnectedCallback";
export function disconnectedCallback(target, prop, receiver, handler) {
    return async () => {
        const callback = Reflect.get(target, DISCONNECTED_CALLBACK);
        if (typeof callback === "function") {
            await callback.call(target, receiver);
        }
    };
}
