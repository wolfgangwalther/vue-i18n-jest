"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const debug_1 = require("debug");
const json5_1 = require("json5");
const js_yaml_1 = require("js-yaml");
const debug = debug_1.debug('vue-i18n-jest');
const VUE_I18N_OPTION = '__i18n';
const VUE_I18N_BLOCK_TYPE = 'i18n';
/**
 * Process vue-i18n contents inside of a custom block and prepare it for execution in a testing environment.
 */
function process({ blocks, componentNamespace, filename }) {
    const i18nOption = `${componentNamespace}.${VUE_I18N_OPTION}`;
    const generatedCode = blocks
        .reduce((blocksValues, block) => {
        if (block.type !== VUE_I18N_BLOCK_TYPE)
            return blocksValues;
        const i18nBlockConfig = {
            locale: (block.attrs && block.attrs.locale) || '',
            resource: parseI18nBlockToJSON(block, filename)
        };
        return blocksValues.concat(`${i18nOption}.push(${JSON.stringify(i18nBlockConfig)});`);
    }, []);
    if (generatedCode.length > 0) {
        generatedCode.unshift(`${i18nOption} = ${i18nOption} || [];`);
    }
    debug('generatedCode', generatedCode);
    return generatedCode;
}
exports.default = process;
/**
 * Parse custom `<i18n>` block content to JSON string.
 * @param block SFC block returned from `@vue/component-compiler-utils`
 * @param filename The SFC file being processed
 */
function parseI18nBlockToJSON(block, filename) {
    const lang = block.attrs && block.attrs.lang;
    const src = block.attrs && block.attrs.src;
    const content = src
        ? fs_1.readFileSync(getAbsolutePath(src, filename)).toString()
        : block.content;
    return convertToJSON(content, lang);
}
/**
 * Convert JSON/YAML/JSON5 to minified JSON string.
 * @param source JSON/YAML/JSON5 encoded string
 * @param lang Language used in `source`. Supported JSON, YAML or JSON5.
 * @returns {string} A minified JSON string
 */
function convertToJSON(source, lang) {
    switch (lang) {
        case 'yaml':
        case 'yml':
            return js_yaml_1.safeLoad(source);
        case 'json5':
            return json5_1.parse(source);
        default: // fallback to 'json'
            return JSON.parse(source);
    }
}
function getAbsolutePath(src, fileName) {
    return path_1.isAbsolute(src) ? src : path_1.resolve(fileName, '../', src);
}
