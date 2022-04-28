export declare const providerProtocol: {
    wss: string;
    https: string;
};
export declare class NodeUrl {
    private frozenProviders;
    private mutateProvider;
    private abortSearch;
    net: string;
    constructor(net: string);
    private getProviders;
    protected getNewProvider(): Promise<string | void>;
    freeProvider(): void;
}
