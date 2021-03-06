import {Guild, GuildMember, Message} from "discord.js"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Detector} from "./../../structures/Detector"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class UnbanAll extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Unbans everyone (no undo).",
            help:
            `
            \`unbanall\` - Unbans everyone in this server
            `,
            examples:
            `
            \`=>unbanall\`
            `,
            guildOnly: true,
            aliases: [],
            cooldown: 10,
            nsfw: true
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        if (!await perms.checkAdmin()) return
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        if (!message.guild?.me?.hasPermission(["MANAGE_GUILD", "BAN_MEMBERS"])) return message.reply(`I need the **Manage Server** and **Ban Members** permissions ${discord.getEmoji("kannaFacepalm")}`)
        const banList = await message.guild!.fetchBans().then((e) => e.map((b) => b.user.id))

        for (let i = 0; i < banList.length; i++) {
            try {
                await message.guild?.members.unban(banList[i], "Unbanning all members")
                await Functions.timeout(100)
                if (discord.checkMuted(message)) await Functions.timeout(1000)
            } catch {
                continue
            }
        }

        return message.reply(`Unbanned everyone in this server! ${discord.getEmoji("mexShrug")}`)
    }
}
