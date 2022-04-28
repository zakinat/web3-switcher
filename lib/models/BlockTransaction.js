"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockTransaction = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
/**
 * Additional entities for EXPORT!
 */
let BlockTransaction = class BlockTransaction extends sequelize_typescript_1.Model {
};
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BIGINT, allowNull: false, }),
    tslib_1.__metadata("design:type", Number)
], BlockTransaction.prototype, "blockNumber", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING, allowNull: false, }),
    tslib_1.__metadata("design:type", String)
], BlockTransaction.prototype, "txHash", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(15), allowNull: false, }),
    tslib_1.__metadata("design:type", String)
], BlockTransaction.prototype, "net", void 0);
BlockTransaction = tslib_1.__decorate([
    sequelize_typescript_1.Table
], BlockTransaction);
exports.BlockTransaction = BlockTransaction;
//# sourceMappingURL=BlockTransaction.js.map