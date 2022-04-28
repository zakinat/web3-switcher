import { Model } from 'sequelize-typescript';
export declare class ParserInfo extends Model {
    address: string;
    network: string;
    lastBlock: number;
}
