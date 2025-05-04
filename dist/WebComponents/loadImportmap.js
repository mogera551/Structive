export function loadImportmap() {
    const importmap = {};
    document.querySelectorAll("script[type='importmap']").forEach(script => {
        const scriptImportmap = JSON.parse(script.innerHTML);
        if (scriptImportmap.imports) {
            importmap.imports = Object.assign(importmap.imports || {}, scriptImportmap.imports);
        }
    });
    return importmap;
}
