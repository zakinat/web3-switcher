import { HttpProvider, WebsocketProvider, } from 'web3-core';
import WEB3 from 'web3';
import { Error, } from 'sequelize';
import NodeUrl, { providerProtocol, } from './NodeUrl';
import { IConfigSwitcher, TAsyncFunction, } from './interfaces';
import { sleep, TIMED_FUNC_MSG_ERR, } from './utils';

class Switcher {
  switcherConfig: IConfigSwitcher;

  net: string;

  // the name of the property where we want to change the provider after breaking
  private inName: string;

  protected lastProviderHasHttp: boolean;

  protected hasHttp: boolean;

  protected timeoutIDParseEventLop: NodeJS.Timeout | null;

  protected node: NodeUrl;

  protected constructor(net: string, inName: string, config: IConfigSwitcher) {
    this.net = net;
    this.switcherConfig = config;
    this.inName = inName;
    this.node = NodeUrl
      .findOrCreate(this.net, this.switcherConfig.isRandomSwitcher);
  }

  protected getProvider(url: string): HttpProvider | WebsocketProvider {
    this.hasHttp = url.includes(providerProtocol.https);

    return this.hasHttp
      ? new WEB3.providers.HttpProvider(url, this.switcherConfig.providersOptions.http)
      : new WEB3.providers.WebsocketProvider(url, this.switcherConfig.providersOptions.wss);
  }

  protected setProvider(provider: string): void {
    const providerWS = this.getProvider(provider);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this[this.inName].setProvider(providerWS);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.log('\x1b[32m%s\x1b[0m', `Changed provider, net: ${this.net}, ${this.address ? `in the Contract ${this.address}` : ''} provider:`, provider);
  }

  protected async handleReconnect(): Promise<void | boolean> {
    this.lastProviderHasHttp = this.getUrlProvider().includes(providerProtocol.https);

    const provider = await this.node
      .getNewProvider();

    if (!provider) {
      await sleep(this.switcherConfig.waitingFailReconnect);
      return;
    }

    this.setProvider(provider as string);

    await sleep(this.switcherConfig.waitingFailReconnect);
  }

  protected getUrlProvider(): string {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const provider = this[this.inName].currentProvider as unknown as { host: string, url: string, };

    return provider.url || provider.host;
  }

  protected async checkProviderError(msg: string, funcName: string, ...params: unknown[])
        : Promise<any> {
    console.error(`Error in ${funcName}, net: ${this.net}, provider: ${this.getUrlProvider()}, params`, params, msg);

    if (this.switcherConfig.providerErrors.some((err) => msg.includes(err))) {
      await this.handleReconnect();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return await this[funcName](...params);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    throw new Error(msg);
  }

  protected async promiseFunc(callFunc: TAsyncFunction<any, any>, ...params: unknown[]): Promise<any> {
    return Promise.race([
      callFunc(...params),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          reject(new Error(`${TIMED_FUNC_MSG_ERR}! more than ${this.switcherConfig.waitingWeb3Response}`));
        }, this.switcherConfig.waitingWeb3Response);
      })
    ]);
  }
}

export default Switcher;
