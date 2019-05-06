import * as redis from "redis";
import {CronJob} from "cron";
import * as rabbitmq from "amqp-ts";
import {Config, LoadConfigAsync} from "./config"
import { promisify } from "util";

let redisClient : redis.RedisClient;
let rabbitClient : rabbitmq.Connection;
let rabbitExchange : rabbitmq.Exchange;

let config : Config;

// Check shards every minute.
let watchJob = new CronJob("* */1 * * * *", CheckShardsAsync);

let HashGetAllAsync;

async function MainAsync() {
    config = await LoadConfigAsync("./config.json");
    redisClient = redis.createClient(config.redisUrl);
    HashGetAllAsync = promisify(redisClient.HGETALL);

    rabbitClient = new rabbitmq.Connection(config.amqpUrl);
    rabbitExchange = rabbitClient.declareExchange("gateway-command", "fanout");
    watchJob.start();
}

async function CheckShardsAsync() {
    let allShards = await HashGetAllAsync("gateway:shards");
    for(let v in allShards)
    {
        if(allShards[v] == "0")
        {
            rabbitExchange.publish(JSON.stringify({
                shard_id: v,
                type: "reconnect"
            }));
            await WaitAsync(5000);
        }
    }
}

async function WaitAsync(ms : number) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

MainAsync();