import { IStateHandler } from "../types";
export declare function setCacheable(handler: IStateHandler, callback: () => Promise<void>): Promise<void>;
