interface IProvidersInit {
    isTestNet?: boolean;
    providers?: any[];
}
export default function createDbProvider({ isTestNet, providers, }?: IProvidersInit): Promise<void>;
export {};
