import { AbiItem, } from 'web3-utils';
import { EventData, Contract as IContract, } from 'web3-eth-contract';
import { Server, } from '@hapi/hapi';
import { Error, } from 'sequelize';
import {
  BlockInfo, IListenerParams, IMap,
  IParamsListener, IParseEventsLoopParams,
  IParseEventsParams, jobsCallbackType,
  parseCallbackType,
} from './interfaces';
import { ParserInfo, } from './models';
import { sleep, } from './utils';

import Web3 from './Web3';
import Switcher from './Switcher';
import { providerProtocol, } from './NodeUrl';

// eslint-disable-next-line no-use-before-define
const contractsIns: IMap<string, Contract> = new Map();

class Contract extends Switcher {
  address: string;

  web3: Web3;

  protected contract: IContract;

  protected eventDataContracts: parseCallbackType;

  protected hasListener: boolean;

  protected isSubscribed: boolean;

  protected constructor(Abi: AbiItem[], address: string, net: string) {
    const web3 = Web3.find(net);

    super(net, 'contract', web3.switcherConfig);

    this.web3 = web3;
    this.address = address.toLowerCase();
    this.hasListener = false;
    this.isSubscribed = false;
    this.contract = web3.createContract(Abi, address);
    this.hasHttp = this.getUrlProvider().includes(providerProtocol.https);
  }

  // create new instance of contract every time we call it
  static create = (Abi: AbiItem[], address: string, net: string): Contract => new Contract(Abi, address, net);

  // create only one instance of the contract and save it in memory and return saved one
  static findOrCreate(Abi: AbiItem[], address: string, net: string): Contract {
    const contractKey = Contract.getKey(address, net);

    if (!contractsIns.has(contractKey)) {
      contractsIns.set(contractKey, this.create(Abi, address, net));
    }

    return contractsIns.get(contractKey);
  }

  // find saved contract in memory by key and return it
  static find(address: string, net: string): Contract {
    const contractKey = Contract.getKey(address, net);

    if (contractsIns.has(contractKey)) {
      return contractsIns.get(contractKey);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    throw new Error(`Error you haven't created contract ${address}_${net}`);
  }

  static getKey = (address: string, net: string) => `${address.toLowerCase()}_${net}`;

  async sendMethod(method: string, ...params: any[]): Promise<any> {
    try {
      const transaction = await this.contract.methods[method](...params);

      const from = this.web3.getAccountAddress();

      const gas = await transaction.estimateGas({ from, });

      const txInfo = await this.promiseFunc(transaction.send, { from, gas, });

      return txInfo.transactionHash;
    }
    catch (e) {
      return await this
        .checkProviderError(e.message, this.sendMethod.name, method, ...params);
    }
  }

  async callMethod(method: string, ...params: any[]): Promise<any> {
    try {
      return await this.promiseFunc(this.contract.methods[method](...params).call);
    }
    catch (e) {
      return await this
        .checkProviderError(e.message, this.callMethod.name, method, ...params);
    }
  }

  /**
     * Web3 listeners and subscribers
     */

  private async subscribeAllEvents(): Promise<void> {
    try {
      const fromBlock = await this.web3.getBlockNumber();

      this.contract.events.allEvents({ fromBlock, })
        .on('data', (data: object) => {
          this.eventDataContracts(data, !this.hasHttp);
        });

      this.isSubscribed = true;

      console.log('\x1b[32m%s\x1b[0m', `subscribeAllEvents successfully in Contract ${this.address}_${this.net}`);
    }
    catch (e) {
      this.isSubscribed = false;

      return await this
        .checkProviderError(e.message, this.subscribeAllEvents.name);
    }
  }

  private async parseEventsLoop(params: IParseEventsLoopParams): Promise<void> {
    const { firstBlock, events, } = params;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [parseInfo] = await ParserInfo.findOrCreate({
          where: { network: this.net, address: this.net, }, defaults: { lastBlock: firstBlock, },
        });
        const fromBlock = +parseInfo.lastBlock + 1;

        await this.parseEvents({
          fromBlock,
          events,
        });

        await this.sleepParseEvent();
      }
    }
    catch (e) {
      console.error('ParseEventsLoop Cancelled', e.message);
    }
  }

  private async getEvent(event: string, options: BlockInfo): Promise<EventData[]> {
    try {
      return await this.contract.getPastEvents(event, options);
    }
    catch (e) {
      return await this
        .checkProviderError(e.message, this.getEvent.name, event, options);
    }
  }

  private async parseEvents(params: IParseEventsParams): Promise<void> {
    let { fromBlock, events, } = params;
    const latest = await this.web3.getBlockNumber();
    const { parseLimit, } = this.web3.config;

    console.log(`parseEvents net: ${this.net}, address: ${this.address} lastBlockNumber:`, latest);

    for (let toBlock = fromBlock + parseLimit; toBlock <= latest + parseLimit;
      toBlock += parseLimit) {
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
          const items = await this.getEvent(event, options);

          for (const item of items) {
            // isWS = false meant doesn't need to send socket event!
            try {
              await this.eventDataContracts(item, this.hasHttp);
            }
            catch (e) {
              console.error(`Error in jobs, contract: ${this.address} ${this.net} for the event`, item, 'with the Error', e);
            }
          }

          await sleep(this.web3.config.waitingEventParsing);
        }

        await ParserInfo.update(
          { lastBlock: options.toBlock, },
          { where: { network: this.net, address: this.address, }, }
        );
      }
      catch (e) {
        console.error(`Error in parseEvents, for : ${Contract.getKey(this.address, this.net)}, provider: ${this.getUrlProvider()}`, e);
      }

      fromBlock = toBlock;
    }
  }

  private async subscribe(jobsCallback: jobsCallbackType, params: IListenerParams): Promise<void> {
    this.eventDataContracts = async (data: any, isWs : boolean) => await jobsCallback({
      ...params, data, isWs, net: this.net, address: this.address,
    });

    if (!this.hasHttp) {
      await this.subscribeAllEvents();
    }

    this.parseEventsLoop({
      firstBlock: params.firstBlock,
      events: params.contractEvents,
    });
  }

  async listener(server: Server, p: IParamsListener): Promise<void> {
    this.hasListener = true;

    try {
      await this.subscribe(p.jobs, {
        server,
        firstBlock: p.firstBlock,
        listenerParams: p.listenerParams,
        contractEvents: p.contractEvents,
      });
    }
    catch (e) {
      console.error(`Failed to listen for the contract  ${this.address}_${this.net}`);
    }
  }

  /**
     * Utils func
     * */
  sleepParseEvent = (): Promise<void> => new Promise((res) => {
    this.timeoutIDParseEventLop = setTimeout(res, this.hasHttp
      ? this.web3.config.parseEventsIntervalMs.http
      : this.web3.config.parseEventsIntervalMs.wss);
  });

  protected async checkProviderError(msg: string, funcName: string, ...params: unknown[])
    : Promise<any> {
    console.error(`Error in ${funcName}, net: ${this.net}, provider: ${this.getUrlProvider()}, params`, params, msg);

    if (this.switcherConfig.providerErrors.some((err) => msg.includes(err))) {
      await this.handleReconnect();

      if ((this.hasHttp !== this.lastProviderHasHttp)) {
        if (this.timeoutIDParseEventLop) {
          clearTimeout(this.timeoutIDParseEventLop);
          this.timeoutIDParseEventLop = null;
        }

        if (this.hasListener && !this.isSubscribed) {
          await this.subscribeAllEvents();
        }
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return await this[funcName](...params);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    throw new Error(msg);
  }
}

export default Contract;
