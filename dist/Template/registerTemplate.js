/**
 * HTMLTemplateElement を ID で登録・取得するための管理モジュール。
 *
 * 役割:
 * - registerTemplate: 指定 ID でテンプレートを登録（空テキスト除去と data-bind 解析を実行）
 * - getTemplateById: 指定 ID のテンプレートを取得（未登録時はエラー）
 *
 * Throws（getTemplateById）:
 * - TMP-001 Template not found: 未登録のテンプレート ID を要求
 */
import { registerDataBindAttributes } from "../BindingBuilder/registerDataBindAttributes.js";
import { raiseError } from "../utils.js";
import { removeEmptyTextNodes } from "./removeEmptyTextNodes.js";
const templateById = {};
/**
 * テンプレートを ID で登録し、内部インデックスと data-bind 情報を構築する。
 *
 * @param id       テンプレート ID
 * @param template HTMLTemplateElement
 * @param rootId   ルートテンプレート ID（ネスト解析用）
 * @returns       登録した ID
 */
export function registerTemplate(id, template, rootId) {
    removeEmptyTextNodes(template.content);
    registerDataBindAttributes(id, template.content, rootId);
    templateById[id] = template;
    return id;
}
/**
 * 登録済みテンプレートを取得する。
 *
 * @throws TMP-001 Template not found
 */
export function getTemplateById(id) {
    return templateById[id] ?? raiseError({
        code: "TMP-001",
        message: `Template not found: ${id}`,
        context: { where: 'registerTemplate.getTemplateById', templateId: id },
        docsUrl: "./docs/error-codes.md#tmp",
    });
}
