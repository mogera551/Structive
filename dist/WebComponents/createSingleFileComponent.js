function escapeEmbed(html) {
    return html.replaceAll(/\{\{([^\}]+)\}\}/g, (match, expr) => {
        return `<!--{{${expr}}}-->`;
    });
}
function unescapeEmbed(html) {
    return html.replaceAll(/<!--\{\{([^\}]+)\}\}-->/g, (match, expr) => {
        return `{{${expr}}}`;
    });
}
let id = 0;
export async function createSingleFileComponent(text) {
    const template = document.createElement("template");
    template.innerHTML = escapeEmbed(text);
    const html = template.content.querySelector("template");
    html?.remove();
    const script = template.content.querySelector("script[type=module]");
    let scriptModule = {};
    if (script) {
        const uniq_comment = `\r\n/*__UNIQ_ID_${id++}__*/`;
        const b64 = btoa(String.fromCodePoint(...new TextEncoder().encode(script.text + uniq_comment)));
        scriptModule = await import("data:application/javascript;base64," + b64);
    }
    //  const scriptModule = script ? await import("data:text/javascript;charset=utf-8," + script.text) : {};
    script?.remove();
    const style = template.content.querySelector("style");
    style?.remove();
    const stateClass = (scriptModule.default ?? class {
    });
    return {
        text,
        html: unescapeEmbed(html?.innerHTML ?? "").trim(),
        css: style?.textContent ?? "",
        stateClass,
    };
}
