import { EventData, } from 'web3-eth-contract';
import { HttpProviderOptions, WebsocketProviderOptions, } from 'web3-core-helpers';
import { Server, } from '@hapi/hapi';
import Web3 from './Web3';
import Contract from './Contract';

export interface IBlockTx {
  blockNumber: number,
  txHash: string,
}

export type parseCallbackType = (data: object, isWs: boolean) => Promise<void>;

interface IBaseListener {
  listenerParams: Record<string, any>,
  contractEvents?: string[],
}

export interface IListenerParams extends IBaseListener {
  server: Server,
  firstBlock: number,
}

export interface IJobsParams extends IListenerParams {
  net: string,
  data: EventData,
  isWs: boolean,
  address: string,
}

export type jobsCallbackType = (params: IJobsParams) => Promise<void>;

export interface IParamsListener extends IBaseListener {
  firstBlock: number,
  jobs: jobsCallbackType,
}

export interface IParseEventsCore {
  events?: string[],
}

export interface IParseEventsLoopParams extends IParseEventsCore {
  firstBlock: number,
}

export interface BlockInfo {
  fromBlock: number,
  toBlock: number,
}

export interface IParseEventsParams extends IParseEventsCore {
  fromBlock: number,
  toBlock?: number | string,
}

export interface IProviders {
  wss?: WebsocketProviderOptions,
  http?: HttpProviderOptions,
}

export interface IUserConfigSwitcher {
  providersOptions?: IProviders,
  waitingFailReconnect?: number,
  maxReconnectCount?: number,
  isRandomSwitcher?: boolean,
  waitingWeb3Response?: number,
}

export interface parseEventsIntervalMs {
  http?: number,
  wss?: number,
}

export interface IWeb3Config {
  parseEventsIntervalMs: parseEventsIntervalMs,
  waitingEventParsing: number,
  parseLimit: number,
}

export interface IUserWeb3Config extends Partial<IWeb3Config>, IUserConfigSwitcher{
  envProvider: string,
  extendProviderErrors?: string[],
}

export interface IConfigSwitcher extends Required<IUserConfigSwitcher> {
  providerErrors: string[],

}

export type TAsyncFunction <A, O> = (...args: A[]) => Promise<O>;

export interface IMap<K, V> extends Map<K, V> {
  get(key: K): V;
}

export type IMutateClasses = Web3 | Contract;
