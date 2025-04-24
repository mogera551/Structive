export function registerComponentClasses(componentClasses) {
    Object.entries(componentClasses).forEach(([tagName, componentClass]) => {
        componentClass.define(tagName);
    });
}
