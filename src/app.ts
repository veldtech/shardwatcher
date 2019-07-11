import * as redis from "redis";
import {CronJob} from "cron";
import * as rabbitmq from "amqp-ts";
import { promisify } from "util";
import { config } from "dotenv";
config({
    path: "../.env",
    encoding: "utf8"
})

let redisClient : redis.RedisClient;
let rabbitClient : rabbitmq.Connection;
let rabbitExchange : rabbitmq.Exchange;

// Check shards every minute.
let watchJob = new CronJob("* 0 * * * *", CheckShardsAsync);

let HashGetAllAsync;
let AuthenticateAsync;

async function MainAsync(): Promise<void> {

    console.log("setting up redis");
    redisClient = redis.createClient(process.env.REDIS_URL);

    // Set bindings for async/await
    HashGetAllAsync = promisify(redisClient.HGETALL)
        .bind(redisClient);
    AuthenticateAsync = promisify(redisClient.AUTH)
        .bind(redisClient);

    if(process.env.REDIS_PASSWORD)
    {
        await AuthenticateAsync(process.env.REDIS_PASSWORD);
    }

    console.log("setting up rabbitmq");
    rabbitClient = new rabbitmq.Connection(process.env.RABBIT_URL);
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