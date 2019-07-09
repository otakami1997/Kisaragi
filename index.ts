require('dotenv').config();
const token = process.env.TOKEN;
const {promisify} = require("util");
const readdir = promisify(require("fs").readdir);

import {Client} from "discord.js";

const client = new Client(); 

const Pool: any = require('pg').Pool;

    exports.pgPool = new Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
      sslmode: process.env.PGSSLMODE,
      max: 15
    });

//let version: string = "1.0.0";

const subDirectory: string[] = [
    "administrator",
    "anime",
    "bot owner",
    "configuration",
    "geometry dash",
    "heart",
    "hentai",
    "info",
    "level",
    "logging",
    "moderator",
    "music",
    "osu",
    "role",
    "utility"
];

const commandAliases: any = {
    "createguild": [],
    "eval": [],
    "reboot": [],
    "reload": [],
    "set": [],
    "avatar": [],
    "emoji": [],
    "guild": [],
    "help": [],
    "ping": [],
    "prefix": [],
    "give": [],
    "rank": [],
    "top": [],
    "del": ["prune", "purge", "d"],
    "role": [],
    "remdash": []
}

const start = async () => {

    const logger = require("./exports/logger.js");
    const queries = require('./exports/queries.js')(client);

    let cmdFiles: string[] = [];

    for (let i in subDirectory) {
        let currDir = subDirectory[i];
        let addFiles = await readdir(`./commands/${currDir}`);
        if (addFiles !== null) {
            cmdFiles.push(addFiles);
        }
        addFiles.forEach(async (file: any) => {
            if (!file.endsWith(".js")) return;
            let path = `./commands/${currDir}/${file}`;
            let commandName = file.split(".")[0];
            let cmdFind = await queries.fetchCommand(commandName, "command");
            if (cmdFind === undefined || null) {
                await queries.insertCommand(commandName, commandAliases[commandName], path);
            } else {
                await queries.updateAliases(commandName, commandAliases[commandName]);
            }
            logger.log(`Loading Command: ${commandName}`);
        });      
    }

    setTimeout(async () => {
    
        let evtFiles = await readdir("./events/");
    
        evtFiles.forEach((file: any) => {
            if (!file.endsWith(".js")) return;
            const eventName = file.split(".")[0];
            logger.log(`Loading Event: ${eventName}`);
            const event = require(`./events/${file}`);
            client.on(eventName, event.bind(null, client));
        });
    
        logger.log(`Loaded a total of ${cmdFiles.length} commands.`);
        logger.log(`Loaded a total of ${evtFiles.length} events.`);
    
        client.login(token);

    }, 1000);
}

start();


