"use strict";
/**
 * Date utility functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWeekend = exports.diffInDays = exports.addDays = exports.parseDate = exports.formatDate = void 0;
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};
exports.formatDate = formatDate;
const parseDate = (dateString) => {
    return new Date(dateString);
};
exports.parseDate = parseDate;
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const diffInDays = (date1, date2) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / msPerDay);
};
exports.diffInDays = diffInDays;
const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};
exports.isWeekend = isWeekend;
//# sourceMappingURL=date-utils.js.map