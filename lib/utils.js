"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.minutesToMilliSec = void 0;
/** Convert minutes to milliseconds */
const minutesToMilliSec = (minutes) => minutes * 60 * 1000;
exports.minutesToMilliSec = minutesToMilliSec;
const sleep = (ms) => new Promise((res) => { setTimeout(res, ms); });
exports.sleep = sleep;
//# sourceMappingURL=utils.js.map