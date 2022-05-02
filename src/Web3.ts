import WEB3 from 'web3';
import {
  toHex, soliditySha3, Mixed, AbiItem,
} from 'web3-utils';
import { Sign, } from 'web3-core';
import { BlockTransactionString, } from 'web3-eth';
import { Error, } from 'sequelize';
import { Contract, } from 'web3-eth-contract';
import { getConfigSwitcher, getConfigWeb3, } from './utils';
import {
  IMap, IUserWeb3Config, IWeb3Config,
} from './interfaces';
import Switcher from './Switcher';

// eslint-disable-next-line no-use-before-define
const web3Ins: IMap<string, Web3> = new Map();

class Web3 extends Switcher {
  config: IWeb3Config;

  static readonly utils = WEB3.utils;

  static readonly web3Version = WEB3.version;

  protected web3: WEB3;

  private readonly walletKey?: string;

  protected constructor(net: string, config: IUserWeb3Config, walletKey?: string) {
    super(net, 'web3', getConfigSwitcher(config));

    this.config = getConfigWeb3(config);

    this.walletKey = walletKey;

    this.initWeb3(config.envProvider);
  }

  static init(net: string, config: IUserWeb3Config, walletKey?: string): void {
    if (!web3Ins.has(net)) {
      const web3 = new Web3(net, config, walletKey);

      web3Ins.set(net, web3);
    }
  }

  static find(net: string): Web3 {
    if (web3Ins.has(net)) {
      return web3Ins.get(net);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    throw new Error(`Error you haven't initialized your web3  for the network ${net}`);
  }

  /**
   * Handle provider (Init web3)
   */

  private initWeb3(url: string) {
    this.web3 = new WEB3(this.getProvider(url));

    if (this.walletKey) {
      const account = this.web3.eth.accounts.privateKeyToAccount(this.walletKey);
      this.web3.eth.accounts.wallet.add(account);
      this.web3.eth.defaultAccount = account.address;
    }

    console.log('\x1b[32m%s\x1b[0m', `Init web3, net: ${this.net}, provider:`, url);
  }

  /** Get last block from blockchain */
  async getBlockNumber(): Promise<number> {
    try {
      return await this.promiseFunc(this.web3.eth.getBlockNumber);
    }
    catch (e) {
      return await this.checkProviderError(e.message, this.getBlockNumber.name);
    }
  }

  /** Get additional info from blockchain */
  async getBlockAdditionInfo(blockNumber: number): Promise<BlockTransactionString> {
    try {
      return await this.promiseFunc(this.web3.eth.getBlock, blockNumber);
    }
    catch (e) {
      return await this.checkProviderError(e.message, this.getBlockAdditionInfo.name, blockNumber);
    }
  }

  /** Get user balance */
  async getUserBalance(address: string, isWei = false): Promise<string> {
    try {
      const balance = await this.promiseFunc(this.web3.eth.getBalance, address);

      return isWei ? this.web3.utils.fromWei(balance) : balance;
    }
    catch (e) {
      return await this.checkProviderError(e.message, this.getUserBalance.name, address, isWei);
    }
  }

  getAccountAddress = (): string => this.web3.eth.accounts.wallet[0].address;

  async getGasPrice(): Promise<string> {
    try {
      const price = await this.promiseFunc(this.web3.eth.getGasPrice);

      return toHex(price);
    }
    catch (e) {
      return await this.checkProviderError(e.message, this.getGasPrice.name);
    }
  }

  createSignature(data: Mixed[]): Sign {
    if (!this.walletKey) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new Error('You need to add wallet key!');
    }

    const solSha = soliditySha3(...data);

    if (!solSha) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new Error('Got null from soliditySha3.');
    }

    return this.web3.eth.accounts.sign(solSha, this.walletKey);
  }

  recover(messageHash: string, signature: string): string {
    try {
      return this.web3.eth.accounts.recover(messageHash, signature).toLowerCase();
    }
    catch (e) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new Error(e.message);
    }
  }

  createContract(Abi: AbiItem[], address: string): Contract {
    return new this.web3.eth.Contract(Abi, address);
  }
}

export default Web3;
