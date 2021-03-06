import {GuildChannel, Message, MessageFlags, TextChannel} from "discord.js"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Reason extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Edits the reason of a case.",
          help:
          `
          \`reason case reason?\` - Changes the reason
          `,
          examples:
          `
          \`=>reason 3 being bad\`
          `,
          guildOnly: true,
          aliases: [],
          cooldown: 5
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        const sql = new SQLQuery(message)
        if (!await perms.checkMod()) return

        const caseNumber = Number(args[1])
        if (!caseNumber) return message.reply(`You need to specify a case number ${discord.getEmoji("kannaFacepalm")}`)
        let reason = Functions.combineArgs(args, 2).trim()
        if (!reason) reason = "None provided!"
        let cases = await sql.fetchColumn("guilds", "cases")
        cases = cases.map((c: any) => JSON.parse(c))
        if (!cases) return message.reply(`This server has no cases. You need to enable **mod log** in \`logs\` to record them. ${discord.getEmoji("kannaFacepalm")}`)
        const index = cases.findIndex((c: any) => Number(c.case) === caseNumber)
        if (index === -1) return message.reply(`Invalid case number ${discord.getEmoji("kannaFacepalm")}`)

        cases[index].reason = reason
        await sql.updateColumn("guilds", "cases", cases)

        const msg = await discord.fetchMessage(message, cases[index].message)

        if (msg) {
            const embed = msg.embeds[0]
            let channelName = ""
            let context = ""
            const user = await discord.users.fetch(cases[index].user)
            const executor = await discord.users.fetch(cases[index].executor)
            if (cases[index].context) {
                const {channelID} = discord.parseMessageURL(cases[index].context)
                channelName = "#" + (discord.channels.cache.get(channelID) as TextChannel)?.name ?? ""
                context = `[**Context**](${cases[index].context})`
            }
            embed
            .setDescription(
                `${discord.getEmoji("star")}_User:_ **${user.tag}** \`(${user.id})\`\n` +
                `${discord.getEmoji("star")}_Moderator:_ **${executor.tag}** \`(${executor.id})\`\n` +
                `${discord.getEmoji("star")}_Reason:_ ${cases[index].reason}\n` +
                context
            )
            await msg.edit(embed)
        }
        const rep = await message.reply(`Successfully edited this case! ${discord.getEmoji("aquaUp")}`)
        rep.delete({timeout: 3000}).catch(() => null)
        message.delete().catch(() => null)
    }
}
