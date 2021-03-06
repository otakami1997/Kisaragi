import {Message, MessageEmbed} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"
import {SQLQuery} from "../../structures/SQLQuery"

export default class DetectChannels extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures channels ignored by anime detection.",
            help:
            `
            \`detectignore\` - Opens the detect ignore prompt
            \`detectignore #channel1 #channel2\` - Sets channels that are ignored from anime detection
            \`detectignore delete setting\` - Deletes a channel
            \`detectignore reset\` - Deletes all channels
            `,
            examples:
            `
            \`=>detectignore #channel\`
            `,
            guildOnly: true,
            aliases: [],
            cooldown: 10
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkAdmin()) return
        const loading = message.channel.lastMessage
        loading?.delete()
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            await detectPrompt(message)
            return
        }

        const ignored = await sql.fetchColumn("guilds", "ignored")
        const step = 5.0
        const increment = Math.ceil((ignored ? ignored.length : 1) / step)
        const detectArray: MessageEmbed[] = []
        for (let i = 0; i < increment; i++) {
            let description = ""
            for (let j = 0; j < step; j++) {
                if (ignored) {
                    const k = (i*step)+j
                    if (!ignored[k]) break
                    description += `**${k + 1} =>**\n` +
                    `${discord.getEmoji("star")}Channel: <#${ignored[k]}>\n`
                } else {
                    description = "None"
                }
            }
            const detectEmbed = embeds.createEmbed()
            detectEmbed
            .setTitle(`**Ignored Anime Detection Channels** ${discord.getEmoji("kisaragiBawls")}`)
            .setThumbnail(message.guild!.iconURL({format: "png", dynamic: true})!)
            .setDescription(Functions.multiTrim(`
                Channels in this list will be exempt from anime detection.
                newline
                __Current Settings__
                ${description}
                newline
                __Edit Settings__
                ${discord.getEmoji("star")}**Mention channels** to add channels.
                ${discord.getEmoji("star")}Type **reset** to delete all settings.
                ${discord.getEmoji("star")}Type **delete (setting number)** to delete a channel.
                ${discord.getEmoji("star")}Type **cancel** to exit.
            `))
            detectArray.push(detectEmbed)
        }

        if (detectArray.length > 1) {
            embeds.createReactionEmbed(detectArray)
        } else {
            message.channel.send(detectArray[0])
        }

        async function detectPrompt(msg: Message) {
            let ignored = await sql.fetchColumn("guilds", "ignored")
            const responseEmbed = embeds.createEmbed()
            responseEmbed.setTitle(`**Ignored Anime Detection Channels** ${discord.getEmoji("kisaragiBawls")}`)
            if (!ignored) ignored = []
            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                msg.channel.send(responseEmbed)
                return
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("guilds", "ignored", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}All settings were **reset**!`)
                msg.channel.send(responseEmbed)
                return
            }
            if (msg.content.toLowerCase().startsWith("delete")) {
                const newMsg = Number(msg.content.replace(/delete/g, "").trim())
                const num = newMsg - 1
                if (newMsg) {
                    ignored[num] = ""
                    ignored = ignored.filter(Boolean)
                    await sql.updateColumn("guilds", "ignored", ignored)
                    return msg.channel.send(responseEmbed.setDescription(`Setting **${newMsg}** was deleted!`))
                } else {
                    return msg.channel.send(responseEmbed.setDescription("Setting not found!"))
                }
            }

            const newChan = msg.content.match(/(?<=<#)(.*?)(?=>)/g)
            if (!newChan?.join("")) return msg.reply("You did not mention any channels!")

            let description = ""

            for (let i = 0; i < newChan.length; i++) {
                ignored.push(newChan[i])
                description += `${discord.getEmoji("star")}Added <#${newChan[i]}>!\n`
            }
            await sql.updateColumn("guilds", "ignored", ignored)
            responseEmbed
            .setDescription(description)
            return msg.channel.send(responseEmbed)
        }

        await embeds.createPrompt(detectPrompt)
    }
}
