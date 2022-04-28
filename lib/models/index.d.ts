import { Sequelize } from 'sequelize-typescript';
import { ParserInfo } from './ParserInfo';
import { NodeProvider } from './NodeProvider';
export declare function switcherDatabase(dbLink: string, logging?: boolean, sync?: boolean): Promise<{
    sequelize: Sequelize;
}>;
export { ParserInfo, NodeProvider, };
export default switcherDatabase;
