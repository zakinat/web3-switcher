"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeProvider = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
let NodeProvider = class NodeProvider extends sequelize_typescript_1.Model {
};
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ primaryKey: true, type: sequelize_typescript_1.DataType.STRING, allowNull: false, }),
    tslib_1.__metadata("design:type", String)
], NodeProvider.prototype, "protocol", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ primaryKey: true, type: sequelize_typescript_1.DataType.STRING, allowNull: false, }),
    tslib_1.__metadata("design:type", String)
], NodeProvider.prototype, "net", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.JSON), allowNull: false, }),
    tslib_1.__metadata("design:type", Array)
], NodeProvider.prototype, "providers", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: false, }),
    tslib_1.__metadata("design:type", Number)
], NodeProvider.prototype, "reTry", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, allowNull: false, defaultValue: false, }),
    tslib_1.__metadata("design:type", Boolean)
], NodeProvider.prototype, "isStop", void 0);
tslib_1.__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    tslib_1.__metadata("design:type", String)
], NodeProvider.prototype, "lastProvider", void 0);
NodeProvider = tslib_1.__decorate([
    sequelize_typescript_1.Table
], NodeProvider);
exports.NodeProvider = NodeProvider;
//# sourceMappingURL=NodeProvider.js.map