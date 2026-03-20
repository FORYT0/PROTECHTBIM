"use strict";
/**
 * String utility functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMentions = exports.slugify = exports.capitalize = exports.truncate = void 0;
const truncate = (str, maxLength) => {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
};
exports.truncate = truncate;
const capitalize = (str) => {
    if (!str)
        return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
exports.capitalize = capitalize;
const slugify = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]);
    }
    return mentions;
};
exports.extractMentions = extractMentions;
//# sourceMappingURL=string-utils.js.map