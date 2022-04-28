import { Model } from 'sequelize-typescript';
export interface IUrlInfo {
    url: string;
    urlReTry: number;
}
export declare class NodeProvider extends Model {
    protocol: string;
    net: string;
    providers: IUrlInfo[];
    reTry: number;
    isStop: boolean;
    lastProvider?: string;
}
