module.exports = (client: any, message: any) => {

    const Pool: any = require('pg').Pool;

    const pgPool = new Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
      sslmode: process.env.PGSSLMODE,
    });

    const tableList: string[] = [
        "birthdays",
        "blocks",
        "channels",
        "emojis",
        "guild info",
        "guilds",
        "images",
        "logs",
        "points",
        "prefixes",
        "roles",
        "special channels",
        "special roles",
        "timezones",
        "users",
        "warns",
        "welcome leaves"
    ];

    //Run Query
    client.runQuery = async (query: any) => {

        let start: number = Date.now();
        try {
          await pgPool.query(query).then((result: any) => result.rows);
          client.logQuery(Object.values(query)[0], start);
        } catch(error) {
          console.log(error.stack); 
        }
    }

    //Log Query
    client.logQuery = (text: string, start: number) => {
      let chalk: any = require("chalk");
      let moment: any = require("moment");
      const timestamp: string = `${moment().format("MM DD YYYY hh:mm:ss")} ->`;
      const duration: number = Date.now() - start;
      let queryString: string = `${timestamp} Executed query ${text} in ${duration} ms`;
      console.log(chalk`{magentaBright ${queryString}}`);
    }

    //Fetch a row 
    client.fetchRow = async (table: string) => {
        let query: object = {
          text: `SELECT * FROM "${table}" WHERE "guild id" = $1`,
          values: [message.guild.id],
          rowMode:'array'
        }
        const result: any = await client.runQuery(query);
        return result;
    }

    //Fetch commands
    client.fetchCommand = async (command: string, column: string) => {
        let query: object = {
          text: `SELECT "${column}" FROM commands WHERE "command" = $1`,
          values: [command],
          rowMode: 'array'
        };
        const result: any = await client.runQuery(query);
        return (result === undefined || null ? null : result);
    }

    //Fetch aliases
    client.fetchAliases = async (command: string) => {
        let query: object = {
          text: `SELECT aliases FROM commands WHERE "command" = $1`,
          values: [command],
          rowMode: 'array'
        }
        const result: any = await client.runQuery(query);
        return result;
    }

    //Fetch Prefix
    client.fetchPrefix = async () => {
        let query: object = {
          text: `SELECT prefix FROM prefixes WHERE "guild id" = $1`,
          values: [message.guild.id],
          rowMode: 'array'
        }
        const result: any = await client.runQuery(query);
        return result;
    }

    //Fetch a column
    client.fetchColumn = async (table: string, column: string) => {
        let query: object = {
          text: `SELECT "${column}" FROM "${table}" WHERE "guild id" = $1`,
          values: [message.guild.id],
          rowMode: 'array'
        }
        const result: any = await client.runQuery(query);
        return result;
    }

    //Insert row into a table
    client.insertInto = async (table: string, column: string, value: any) => {
        let query: object = {
          text: `INSERT INTO "${table}" ("${column}") VALUES ($1)`,
          values: [value]
        }
        await client.runQuery(query);
    }

    //Insert command
    client.insertCommand = async (command: string, aliases: string[], path: string) => {
      let query: object = {
        text: `INSERT INTO commands (command, aliases, path) VALUES ($1, $2, $3)`,
        values: [command, aliases, path]
      }
      await client.runQuery(query);
  }

    //Update a row in a table
    client.updateColumn = async (table: string, column: string, value: any) => {
        let query: object = {
          text: `UPDATE "${table}" SET "${column}" = $1 WHERE "guild id" = $2`,
          values: [value, message.guild.id]
        }
        await client.runQuery(query);
          
    }

    //Update Aliases
    //Update a row in a table
    client.updateAliases = async (command: string, aliases: any) => {
      let query: object = {
        text: `UPDATE commands SET aliases = $1 WHERE "command" = $2`,
        values: [aliases, command]
      }
      await client.runQuery(query);
        
  }

    //Remove a guild from all tables
    client.deleteGuild = async (guild: number) => {
        for (let i = 0; i < tableList.length; i++) {
            let query: object = {
              text: `DELETE FROM "${tableList[i]}" WHERE "guild id" = $1`,
              values: [guild]
            }
            await client.runQuery(query);
        }
    }

    //Order tables by guild member count
    client.orderTables = async () => {
        for (let table in tableList) {
            let query: object = {
              text: `SELECT members FROM "${tableList[table]}" ORDER BY members DESC`
            }
            await client.runQuery(query);
        }
    }

    //Init guild
    client.initGuild = async () => {
        let query: object = {
          text: `SELECT "guild id" FROM guilds WHERE "guild id" = $1`,
          values: [message.guild.id],
          rowMode: 'array'
        }
        const result: any = await client.runQuery(query);
        if (result === undefined || null) {
          await client.insertInto("guilds", "guild id", message.guild.id);
          await client.initAll();
          return;
        } else {
          return;
        }
    }
}