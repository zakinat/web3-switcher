"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeProvider = exports.ParserInfo = exports.switcherDatabase = void 0;
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const ParserInfo_1 = require("./ParserInfo");
Object.defineProperty(exports, "ParserInfo", { enumerable: true, get: function () { return ParserInfo_1.ParserInfo; } });
const NodeProvider_1 = require("./NodeProvider");
Object.defineProperty(exports, "NodeProvider", { enumerable: true, get: function () { return NodeProvider_1.NodeProvider; } });
function switcherDatabase(dbLink, logging = false, sync = true) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sequelize = new sequelize_typescript_1.Sequelize(dbLink, {
            dialect: 'postgres',
            models: [
                ParserInfo_1.ParserInfo,
                NodeProvider_1.NodeProvider
            ],
            logging,
        });
        if (sync) {
            yield sequelize.sync();
        }
        return { sequelize, };
    });
}
exports.switcherDatabase = switcherDatabase;
exports.default = switcherDatabase;
//# sourceMappingURL=index.js.map