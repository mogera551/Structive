const CONNECTED_CALLBACK = "$connectedCallback";
export function connectedCallback(target, prop, receiver, handler) {
    return async () => {
        const callback = Reflect.get(target, CONNECTED_CALLBACK);
        if (typeof callback === "function") {
            await callback.call(target, receiver);
        }
    };
}
