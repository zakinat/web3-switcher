import { IConfigSwitcher, IUserWeb3Config, IWeb3Config, } from './interfaces';

/** Init default config */
export const TIMED_FUNC_MSG_ERR = 'Time out';
export const DEFAULT_PROVIDER_ERRORS = [
  TIMED_FUNC_MSG_ERR, 'CONNECTION ERROR', 'querying a node which is not fully synced',
  'Invalid JSON RPC response: ""', 'block range can not exceed', 'Too Many Requests',
  'connection not open on send', 'Maximum number of reconnect attempts'
];

/** Convert minutes to milliseconds */
export const minutesToMilliSec = (minutes: number): number => minutes * 60 * 1000;

export const sleep = (ms: number)
  : Promise<void> => new Promise((res) => {
  setTimeout(res, ms);
});

export const getConfigWeb3 = ({
  waitingEventParsing = 500, // 0.5 secs
  parseLimit = 5000, // parsing limit count in many networks (probably 8k better use 6k)
  parseEventsIntervalMs = {
    wss: minutesToMilliSec(60),
    http: minutesToMilliSec(1 / 12),
  },
} : IUserWeb3Config = { envProvider: '', }): IWeb3Config => ({
  waitingEventParsing,
  parseLimit,
  parseEventsIntervalMs,
});

export const getConfigSwitcher = ({
  providersOptions = {
    wss: {
      timeout: minutesToMilliSec(1),
      clientConfig: {
        maxReceivedFrameSize: 100000000,
        maxReceivedMessageSize: 100000000,
      },
      reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 15,
        onTimeout: false,
      },
    },
    http: {
      timeout: minutesToMilliSec(0.3),
    },
  },
  waitingWeb3Response = minutesToMilliSec(0.5),
  extendProviderErrors = [],
  waitingFailReconnect = minutesToMilliSec(0.1),
  maxReconnectCount = 5,
  isRandomSwitcher = false,
} : IUserWeb3Config = { envProvider: '', }): IConfigSwitcher => ({
  providerErrors: [...new Set([...extendProviderErrors, ...DEFAULT_PROVIDER_ERRORS])],
  isRandomSwitcher,
  providersOptions,
  maxReconnectCount,
  waitingFailReconnect,
  waitingWeb3Response,

});

export function shuffleArray(array: any[]): void {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    // eslint-disable-next-line no-param-reassign
    [array[i], array[j]] = [array[j], array[i]];
  }
}
