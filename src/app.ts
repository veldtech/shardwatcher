import * as redis from "redis";
import {CronJob} from "cron";
import * as rabbitmq from "amqp-ts";
import {Config, LoadConfig} from "./config"

const config : Config = await LoadConfigAsync("./config.json");

let watchJob : CronJob;

async function MainAsync() {


}


new CronJob("*/5 * * * * *",
    () => {

    }).start();