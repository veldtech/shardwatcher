import * as fs from "fs";
import {promisify} from 'util';

const readFile = promisify(fs.readFile);

export interface Config {

}

export async function LoadConfigAsync(file: string): Promise<Config> {
    let jsonBuffer = await readFile(file);
    return jsonBuffer.toJSON();
}