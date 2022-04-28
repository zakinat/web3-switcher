"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeUrl = exports.providerProtocol = void 0;
const tslib_1 = require("tslib");
const models_1 = require("./models");
exports.providerProtocol = {
    wss: 'wss',
    https: 'https',
};
class NodeUrl {
    constructor(net) {
        this.abortSearch = false;
        this.net = net;
        this.frozenProviders = [];
    }
    getProviders() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.frozenProviders.length) {
                this.frozenProviders = yield models_1.NodeProvider.findAll({ where: { net: this.net, }, raw: true, });
            }
        });
    }
    getNewProvider() {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.getProviders();
            if (!this.mutateProvider) {
                const availableProvider = this.frozenProviders
                    .find(({ protocol, reTry, }) => protocol === exports.providerProtocol.wss && !!reTry)
                    || this.frozenProviders
                        .find(({ protocol, reTry, }) => protocol === exports.providerProtocol.https && !!reTry);
                this.mutateProvider = availableProvider ? JSON.parse(JSON.stringify(availableProvider))
                    : null;
            }
            if (!this.mutateProvider || !this.mutateProvider.providers.length || this.abortSearch) {
                return;
            }
            const url = (_a = this.mutateProvider.providers.find(({ urlReTry, }) => !!urlReTry)) === null || _a === void 0 ? void 0 : _a.url;
            if (url) {
                this.mutateProvider.providers = this.mutateProvider.providers
                    .map((info) => (info.url === url ? Object.assign(Object.assign({}, info), { urlReTry: info.urlReTry - 1 }) : info));
                return url;
            }
            this.mutateProvider.reTry -= 1;
            if (this.mutateProvider.reTry < 1) {
                if (this.frozenProviders.every(({ reTry, }) => !reTry)) {
                    return;
                }
                if (this.mutateProvider.isStop) {
                    this.frozenProviders = this.frozenProviders.map((nodeProvider) => {
                        var _a;
                        return (nodeProvider.protocol === ((_a = this.mutateProvider) === null || _a === void 0 ? void 0 : _a.protocol) ? Object.assign(Object.assign({}, nodeProvider), { reTry: 0 }) : nodeProvider);
                    });
                }
                const hasHttp = this.frozenProviders
                    .some(({ protocol, reTry, }) => protocol === exports.providerProtocol.https && !!reTry);
                if (hasHttp && this.mutateProvider.protocol !== exports.providerProtocol.https) {
                    this.mutateProvider = JSON.parse(JSON.stringify(this.frozenProviders
                        .find(({ protocol, reTry, }) => protocol === exports.providerProtocol.https && !!reTry)));
                    return this.getNewProvider();
                }
                this.mutateProvider = null;
                return this.getNewProvider();
            }
            const providers = (_b = this.frozenProviders
                .find(({ protocol, }) => { var _a; return protocol === ((_a = this.mutateProvider) === null || _a === void 0 ? void 0 : _a.protocol); })) === null || _b === void 0 ? void 0 : _b.providers;
            if (providers && providers.length) {
                this.mutateProvider.providers = [...providers];
            }
            return this.getNewProvider();
        });
    }
    freeProvider() {
        this.frozenProviders = [];
    }
}
exports.NodeUrl = NodeUrl;
//# sourceMappingURL=NodeUrl.js.map