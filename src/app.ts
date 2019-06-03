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
let watchJob = new CronJob("* 0 * * * *", CheckShardsAsync);

let HashGetAllAsync;
let AuthenticateAsync;

async function MainAsync(): Promise<void> {
    config = await LoadConfigAsync("./config.json");

    console.log("setting up redis");
    redisClient = redis.createClient(config.redis.url);

    // Set bindings for async/await
    HashGetAllAsync = promisify(redisClient.HGETALL)
        .bind(redisClient);
    AuthenticateAsync = promisify(redisClient.AUTH)
        .bind(redisClient);

    if(config.redis.password)
    {
        await AuthenticateAsync(config.redis.password);
    }

    console.log("setting up rabbitmq");
    rabbitClient = new rabbitmq.Connection(config.amqpUrl);
    rabbitExchange = rabbitClient.declareExchange("gateway-command", "fanout");

    console.log("starting watch job");
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
        }
    }
}

MainAsync();