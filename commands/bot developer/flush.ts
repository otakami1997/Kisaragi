import {Message} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permissions} from "./../../structures/Permissions"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Flush extends Command {
    constructor() {
        super({
            aliases: [],
            cooldown: 3
        })
    }

    public run = async (discord: Kisaragi, message: Message, args: string[]) => {
        const perms = new Permissions(discord, message)
        const embeds = new Embeds(discord, message)
        if (perms.checkBotDev(message)) return
        const flushEmbed = embeds.createEmbed()

        await SQLQuery.flushDB()
        flushEmbed
        .setDescription("The database was **flushed**!")
        message.channel.send(flushEmbed)

    }
}
