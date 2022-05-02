import { NodeProvider, } from './models';
import { shuffleArray, } from './utils';
import { IMap, } from './interfaces';

export const providerProtocol = {
  wss: 'wss',
  https: 'https',
};

// eslint-disable-next-line no-use-before-define
const nodeUrlIns: IMap<string, NodeUrl> = new Map();

class NodeUrl {
  net: string;

  private frozenProviders: NodeProvider[];

  private mutateProvider: NodeProvider | null;

  private readonly isRandom;

  protected constructor(net: string, isRandom: boolean) {
    this.net = net;
    this.frozenProviders = [];
    this.isRandom = isRandom;
  }

  static findOrCreate(net: string, isRandom: boolean): NodeUrl {
    if (!nodeUrlIns.has(net)) {
      nodeUrlIns.set(net, new NodeUrl(net, isRandom));
    }

    return nodeUrlIns.get(net);
  }

  private async getProviders(): Promise<string | void> {
    if (!this.frozenProviders.length) {
      this.frozenProviders = await NodeProvider.findAll({ where: { net: this.net, }, raw: true, });
    }
  }

  async getNewProvider(): Promise<string | void> {
    await this.getProviders();

    if (!this.mutateProvider) {
      const availableProvider = this.frozenProviders
        .find(({ protocol, reTry, }) => protocol === providerProtocol.wss && !!reTry)
        || this.frozenProviders
          .find(({ protocol, reTry, }) => protocol === providerProtocol.https && !!reTry);

      this.mutateProvider = availableProvider ? JSON.parse(JSON.stringify(availableProvider))
        : null;
    }

    if (!this.mutateProvider || !this.mutateProvider.providers.length) {
      return;
    }

    if (this.isRandom) {
      shuffleArray(this.mutateProvider.providers);
    }

    const url = this.mutateProvider.providers.find(({ urlReTry, }) => !!urlReTry)?.url;

    if (url) {
      this.mutateProvider.providers = this.mutateProvider.providers
        .map((info) => (info.url === url ? { ...info, urlReTry: info.urlReTry - 1, } : info));

      return url;
    }

    this.mutateProvider.reTry -= 1;

    if (this.mutateProvider.reTry < 1) {
      if (this.frozenProviders.every(({ reTry, }) => !reTry)) {
        return;
      }

      if (this.mutateProvider.isStop) {
        this.frozenProviders = this.frozenProviders.map((nodeProvider) => (
          nodeProvider.protocol === this.mutateProvider?.protocol ? {
            ...nodeProvider, reTry: 0,
          } : nodeProvider
        )) as NodeProvider[];
      }

      const hasHttp = this.frozenProviders
        .some(({ protocol, reTry, }) => protocol === providerProtocol.https && !!reTry);

      if (hasHttp && this.mutateProvider.protocol !== providerProtocol.https) {
        this.mutateProvider = JSON.parse(JSON.stringify(this.frozenProviders
          .find(({ protocol, reTry, }) => protocol === providerProtocol.https && !!reTry)));

        return this.getNewProvider();
      }

      this.mutateProvider = null;

      return this.getNewProvider();
    }

    const providers = this.frozenProviders
      .find(({ protocol, }) => protocol === this.mutateProvider?.protocol)?.providers;

    if (providers && providers.length) {
      this.mutateProvider.providers = [...providers];
    }

    return this.getNewProvider();
  }
}

export default NodeUrl;
