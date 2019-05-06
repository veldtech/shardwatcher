import * as fs from "fs";
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

export interface Config {
    redisUrl : string,
    amqpUrl : string
}

export async function LoadConfigAsync(file: string): Promise<Config> {
    let jsonBuffer = await readFile(file);
    console.log(jsonBuffer.toString());
    return JSON.parse(jsonBuffer.toString()) as Config;
}