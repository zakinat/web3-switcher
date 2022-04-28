"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3 = void 0;
const tslib_1 = require("tslib");
const web3_1 = tslib_1.__importDefault(require("web3"));
const web3_utils_1 = require("web3-utils");
const models_1 = require("./models");
const utils_1 = require("./utils");
const NodeUrl_1 = require("./NodeUrl");
/** Init default config */
const TIMED_FUNC_MSG_ERR = 'Time out';
const DEFAULT_PROVIDER_ERRORS = [TIMED_FUNC_MSG_ERR, 'CONNECTION ERROR', 'Invalid JSON RPC response: ""'];
const getConfig = ({ envProvider, providersOptions = {
    wss: {
        timeout: (0, utils_1.minutesToMilliSec)(1),
        clientConfig: {
            maxReceivedFrameSize: 100000000,
            maxReceivedMessageSize: 100000000,
        },
        reconnect: {
            auto: true,
            delay: 5000,
            maxAttempts: 15,
            onTimeout: false,
        },
    },
    http: {
        timeout: (0, utils_1.minutesToMilliSec)(0.3),
    },
}, extendProviderErrors = [], waitingWeb3Response = (0, utils_1.minutesToMilliSec)(0.1), waitingFailReconnect = (0, utils_1.minutesToMilliSec)(0.3), waitingEventParsing = 200, // 0.2 secs
parseLimit = 5000, // parsing limit count in many networks (probably 8k better use 6k)
maxReconnectCount = 5, parseEventsIntervalMs = {
    wss: (0, utils_1.minutesToMilliSec)(60),
    http: (0, utils_1.minutesToMilliSec)(1 / 12),
}, } = { envProvider: '', }) => ({
    envProvider,
    providersOptions,
    extendProviderErrors,
    providerErrors: [...new Set([...extendProviderErrors, ...DEFAULT_PROVIDER_ERRORS])],
    waitingWeb3Response,
    waitingFailReconnect,
    waitingEventParsing,
    parseLimit,
    maxReconnectCount,
    parseEventsIntervalMs,
});
class Web3 extends NodeUrl_1.NodeUrl {
    constructor(net, config, walletKey) {
        super(net);
        this.getAccountAddress = () => this.web3.eth.accounts.wallet[0].address;
        if (!config.envProvider) {
            return;
        }
        this.config = getConfig(config);
        this.contracts = {};
        this.eventDataContracts = {};
        this.subscribedContracts = {};
        this.walletKey = walletKey;
        this.initWeb3(config.envProvider);
    }
    /**
     * Handle provider (Init web3)
     */
    getProvider(url) {
        this.hasHttp = url.includes(NodeUrl_1.providerProtocol.https);
        return this.hasHttp
            ? new web3_1.default.providers.HttpProvider(url, this.config.providersOptions.http)
            : new web3_1.default.providers.WebsocketProvider(url, this.config.providersOptions.wss);
    }
    initWeb3(provider) {
        this.web3 = new web3_1.default(this.getProvider(provider));
        if (this.walletKey) {
            const account = this.web3.eth.accounts.privateKeyToAccount(this.walletKey);
            this.web3.eth.accounts.wallet.add(account);
            this.web3.eth.defaultAccount = account.address;
        }
        console.log('\x1b[32m%s\x1b[0m', `Init web3, net: ${this.net}, provider:`, provider);
    }
    setProvider(provider) {
        const providerWS = this.getProvider(provider);
        this.web3.setProvider(providerWS);
        for (const address of Object.keys(this.contracts)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.contracts[address] && this.contracts[address].setProvider(providerWS);
        }
        console.log('\x1b[32m%s\x1b[0m', `Changed provider, net: ${this.net}, provider:`, provider);
    }
    handleReconnect() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.abortReconnect) {
                this.config.maxReconnectCount -= 1;
                this.config.maxReconnectCount < 1 && (yield (0, utils_1.sleep)(this.config.waitingFailReconnect));
                return;
            }
            const provider = yield this.getNewProvider();
            if (!provider) {
                this.abortReconnect = !provider;
                return;
            }
            this.setProvider(provider);
            if (!this.hasHttp) {
                for (const [address, isSub] of Object.entries(this.subscribedContracts)) {
                    !isSub && (yield this.subscribeAllEvents(address));
                }
            }
        });
    }
    /** Update provider from rout */
    updateProvider(provider) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.setProvider(provider);
            return yield this.checkConnection();
        });
    }
    getUrlProvider() {
        const provider = this.web3.currentProvider;
        return provider.url || provider.host;
    }
    /**
     * Web3 methods
     */
    checkConnection() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return !!(yield this.promiseFunc(this.web3.eth.getBlockNumber));
            }
            catch (e) {
                return false;
            }
        });
    }
    /** Get last block from blockchain */
    getBlockNumber() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.promiseFunc(this.web3.eth.getBlockNumber);
            }
            catch (e) {
                return yield this.checkProviderError(e.message, this.getBlockNumber.name);
            }
        });
    }
    /** Get additional info from blockchain */
    getBlockAdditionInfo(blockNumber) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.promiseFunc(this.web3.eth.getBlock, blockNumber);
            }
            catch (e) {
                return yield this.checkProviderError(e.message, this.getBlockAdditionInfo.name, blockNumber);
            }
        });
    }
    /** Get user balance */
    getUserBalance(address, isWei = false) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const balance = yield this.promiseFunc(this.web3.eth.getBalance, address);
                return isWei ? this.web3.utils.fromWei(balance) : balance;
            }
            catch (e) {
                return yield this.checkProviderError(e.message, this.getUserBalance.name, address, isWei);
            }
        });
    }
    getGasPrice() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const price = yield this.promiseFunc(this.web3.eth.getGasPrice);
                return (0, web3_utils_1.toHex)(price);
            }
            catch (e) {
                return yield this.checkProviderError(e.message, this.getGasPrice.name);
            }
        });
    }
    createSignature(data) {
        if (!this.walletKey) {
            throw new Error('You need to add wallet key!');
        }
        const solSha = (0, web3_utils_1.soliditySha3)(...data);
        if (!solSha) {
            throw new Error('Got null from soliditySha3.');
        }
        return this.web3.eth.accounts.sign(solSha, this.walletKey);
    }
    recover(messageHash, signature) {
        try {
            return this.web3.eth.accounts.recover(messageHash, signature).toLowerCase();
        }
        catch (e) {
            throw Error(e.message);
        }
    }
    /**
     * Contract methods
     */
    getContract(Abi, address) {
        if (!this.contracts[address]) {
            this.contracts[address] = new this.web3.eth.Contract(Abi, address);
        }
        return this.contracts[address];
    }
    sendContractMethod(address, method, ...params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const transaction = yield this.contracts[address].methods[method](...params);
                const from = this.getAccountAddress();
                const gas = yield transaction.estimateGas({ from, });
                const txInfo = yield this.promiseFunc(transaction.send, { from, gas, });
                return txInfo.transactionHash;
            }
            catch (e) {
                return yield this
                    .checkProviderError(e.message, this.sendContractMethod.name, address, method, ...params);
            }
        });
    }
    getContractViewMethod(address, method, ...params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.promiseFunc(this.contracts[address].methods[method](...params).call);
            }
            catch (e) {
                return yield this
                    .checkProviderError(e.message, this.getContractViewMethod.name, address, method, ...params);
            }
        });
    }
    /**
     * Web3 listeners and subscribers
     */
    subscribeAllEvents(address) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const fromBlock = yield this.getBlockNumber();
                this.contracts[address].events.allEvents({ fromBlock, })
                    .on('data', this.eventDataContracts[address])
                    .on('error', (error) => {
                    this.subscribedContracts[address] = false;
                    throw error;
                });
                this.subscribedContracts[address] = true;
            }
            catch (e) {
                // TODO watch this errors when the listener breaks
                console.error(`------Error----- in subscribeAllEvents for the contract ${address} in the Network: ${this.net} using the provider: ${this.getUrlProvider()}`, e);
                if (this.config.providerErrors.some((err) => e.message.includes(err))) {
                    yield this.handleReconnect();
                    if (!this.hasHttp) {
                        yield this.subscribeAllEvents(address);
                    }
                }
            }
        });
    }
    parseEventsLoop(params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { address, firstContractBlock, events, } = params;
            try {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const [parseInfo] = yield models_1.ParserInfo.findOrCreate({
                        where: { network: this.net, address, }, defaults: { lastBlock: firstContractBlock, },
                    });
                    const fromBlock = +parseInfo.lastBlock + 1;
                    yield this.parseEvents({
                        address,
                        fromBlock,
                        events,
                    });
                    yield this.sleepParseEventsLoop();
                }
            }
            catch (e) {
                console.error('ParseEventsLoop Cancelled', e.message);
            }
        });
    }
    getEvent(address, event, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.contracts[address].getPastEvents(event, options);
            }
            catch (e) {
                return yield this.checkProviderError(e.message, this.getEvent.name, address, event, options);
            }
        });
    }
    parseEvents(params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { address, } = params;
            let { fromBlock, events, } = params;
            const provider = this.getUrlProvider();
            const latest = yield this.getBlockNumber();
            const { parseLimit, } = this.config;
            console.log(`parseEvents net: ${this.net}, address: ${address} lastBlockNumber:`, latest);
            for (let toBlock = fromBlock + parseLimit; toBlock <= latest + parseLimit; toBlock += parseLimit) {
                const options = {
                    fromBlock,
                    toBlock: toBlock <= latest ? toBlock : latest,
                };
                console.log('\x1b[35m%s\x1b[0m', `Parse '${this.net}': `, options);
                !events && (events = ['allEvents']);
                if (fromBlock >= options.toBlock) {
                    return;
                }
                try {
                    for (const event of events) {
                        const items = yield this.getEvent(address, event, options);
                        for (const item of items) {
                            // isWS = false meant doesn't need to send socket event!
                            try {
                                yield this.eventDataContracts[address](item, provider.includes(NodeUrl_1.providerProtocol.https));
                            }
                            catch (e) {
                                console.error(`Error in jobs, contract: ${address} ${this.net} for the event`, item, 'with the Error', e);
                            }
                        }
                        yield (0, utils_1.sleep)(this.config.waitingEventParsing);
                    }
                    yield models_1.ParserInfo.update({ lastBlock: options.toBlock, }, { where: { network: this.net, address, }, });
                }
                catch (e) {
                    console.error(`Error in parseEvents, net: ${this.net}, provider: ${provider}`, e);
                }
                fromBlock = toBlock;
            }
        });
    }
    subscribe(jobsCallback, params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            this.eventDataContracts[params.address] = (data, isWs = true) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                return yield jobsCallback(Object.assign(Object.assign({}, params), { data, isWs, net: this.net }));
            });
            const hasHttp = this.getUrlProvider().includes(NodeUrl_1.providerProtocol.https);
            if (!hasHttp) {
                yield this.subscribeAllEvents(params.address);
            }
            this.parseEventsLoop({
                hasHttp,
                address: params.address,
                firstContractBlock: params.firstContractBlock,
                events: params.contractEvents,
            });
        });
    }
    listener(server, p) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const address = p.contractData.address.toLowerCase();
            this.getContract(p.abi, address);
            try {
                yield this.subscribe(p.jobs, {
                    server,
                    address,
                    firstContractBlock: p.contractData.firstBlock,
                    listenerParams: p.listenerParams,
                    contractEvents: p.contractEvents,
                });
            }
            catch (e) {
                console.error(`Failed to listen for the contract  ${address}_${this.net}`);
            }
        });
    }
    /**
     * Utils func
     * */
    checkProviderError(msg, funcName, ...params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            console.error(`Error in ${funcName}, net: ${this.net}, provider: ${this.getUrlProvider()}, params`, params, msg);
            if (this.config.providerErrors.some((err) => msg.includes(err))) {
                yield this.handleReconnect();
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return yield this[funcName](...params);
            }
            throw new Error(msg);
        });
    }
    promiseFunc(callFunc, ...params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return Promise.race([
                callFunc(...params),
                new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error(`${TIMED_FUNC_MSG_ERR}! more than ${this.config.waitingWeb3Response}`));
                    }, this.config.waitingWeb3Response);
                })
            ]);
        });
    }
    sleepParseEventsLoop() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const maxInterval = Math.max(this.config.parseEventsIntervalMs.http, this.config.parseEventsIntervalMs.wss);
            const minInterval = Math.min(this.config.parseEventsIntervalMs.http, this.config.parseEventsIntervalMs.wss);
            const sleepCount = Math.floor(maxInterval / minInterval);
            for (let i = 0; i < sleepCount; i += 1) {
                yield (0, utils_1.sleep)(minInterval);
                if (this.hasHttp) {
                    break;
                }
            }
        });
    }
}
exports.Web3 = Web3;
Web3.utils = web3_1.default.utils;
Web3.web3Version = web3_1.default.version;
Web3.modules = web3_1.default.modules;
exports.default = Web3;
//# sourceMappingURL=Web3.js.map