import WEB3 from 'web3';
import { Server } from '@hapi/hapi';
import { AbiItem, Mixed } from 'web3-utils';
import { Sign } from 'web3-core';
import { BlockTransactionString } from 'web3-eth';
import { Contract } from 'web3-eth-contract';
import { NodeUrl } from './NodeUrl';
import { IUserWeb3Config, IWeb3Config, IParamsListener, TAsyncFunction, parseCallbackType } from './interfaces';
export declare class Web3 extends NodeUrl {
    config: IWeb3Config;
    protected web3: WEB3;
    static readonly utils: import("web3-utils").Utils;
    static readonly web3Version: string;
    static modules: import("web3").Modules;
    private readonly walletKey?;
    protected contracts: {
        [address: string]: Contract;
    };
    protected eventDataContracts: {
        [address: string]: parseCallbackType;
    };
    protected subScribedContracts: {
        [address: string]: boolean;
    };
    protected abortReconnect: boolean;
    protected hasHttp: boolean;
    constructor(net: string, config: IUserWeb3Config, walletKey?: string);
    /**
     * Handle provider (Init web3)
     */
    protected getProvider(url: string): import("web3-core").HttpProvider | import("web3-core").WebsocketProvider;
    private initWeb3;
    private setProvider;
    private handleReconnect;
    /** Update provider from rout */
    updateProvider(provider: string): Promise<boolean>;
    getUrlProvider(): string;
    /**
     * Web3 methods
     */
    checkConnection(): Promise<boolean>;
    /** Get last block from blockchain */
    getBlockNumber(): Promise<number>;
    /** Get additional info from blockchain */
    getBlockAdditionInfo(blockNumber: number): Promise<BlockTransactionString>;
    /** Get user balance */
    getUserBalance(address: string, isWei?: boolean): Promise<string>;
    getAccountAddress: () => string;
    getGasPrice(): Promise<string>;
    createSignature(data: Mixed[]): Sign;
    recover(messageHash: string, signature: string): string;
    /**
     * Contract methods
     */
    getContract(Abi: AbiItem[], address: string): Contract;
    sendContractMethod(address: string, method: string, ...params: any[]): Promise<any>;
    getContractViewMethod(address: string, method: string, ...params: any[]): Promise<any>;
    /**
     * Web3 listeners and subscribers
     */
    subscribeAllEvents(address: string): Promise<void>;
    private parseEventsLoop;
    private getEvent;
    private parseEvents;
    private subscribe;
    listener(server: Server, p: IParamsListener): Promise<void>;
    /**
     * Utils func
     * */
    private checkProviderError;
    promiseFunc(callFunc: TAsyncFunction<any, any>, ...params: unknown[]): Promise<any>;
    parseEventsLoopSleep(): Promise<void>;
}
export default Web3;
