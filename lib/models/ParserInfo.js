"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserInfo = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
let ParserInfo = class ParserInfo extends sequelize_typescript_1.Model {
};
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ primaryKey: true, type: sequelize_typescript_1.DataType.STRING, allowNull: false, }),
    tslib_1.__metadata("design:type", String)
], ParserInfo.prototype, "address", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ primaryKey: true, type: sequelize_typescript_1.DataType.STRING, allowNull: false, }),
    tslib_1.__metadata("design:type", String)
], ParserInfo.prototype, "network", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BIGINT, defaultValue: 0, }),
    tslib_1.__metadata("design:type", Number)
], ParserInfo.prototype, "lastBlock", void 0);
ParserInfo = tslib_1.__decorate([
    sequelize_typescript_1.Table
], ParserInfo);
exports.ParserInfo = ParserInfo;
//# sourceMappingURL=ParserInfo.js.map