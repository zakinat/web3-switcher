import { Model } from 'sequelize-typescript';
/**
 * Additional entities for EXPORT!
 */
export declare class BlockTransaction extends Model {
    blockNumber: number;
    txHash: string;
    net: string;
}
