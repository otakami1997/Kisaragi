import axios from "axios"
import {Message, MessageEmbed} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class DiscordBotList extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for bots on discord.bots.gg.",
            help:
            `
            \`bots\` - Gets a random bot.
            \`bots query\` - Searches for bots with the query.
            `,
            examples:
            `
            \`=>bots kisaragi\`
            `,
            aliases: ["bot", "discordbots"],
            random: "none",
            cooldown: 15,
            nsfw: true
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const headers = {
            "authorization": process.env.DISCORD_BOTS_TOKEN,
            "content-type": "application/json"
        }
        const baseURL = "https://discord.bots.gg/api/v1"

        const query = Functions.combineArgs(args, 1).trim()
        let response = "" as any
        if (!query) {
            response = await axios.get(`${baseURL}/bots`, {headers}).then((r) => r.data)
        } else {
            response =  await axios.get(`${baseURL}/bots?q=${query}`, {headers}).then((r) => r.data)
        }

        const botArray: MessageEmbed[] = []
        for (let i = 0; i < response.bots.length; i++) {
            const bot = response.bots[i]
            const botEmbed = embeds.createEmbed()
            const website = bot.website ? `[**Website**](${bot.website})\n` : ""
            const support = bot.supportInvite ? `[**Support Server**](${bot.supportInvite})\n` : ""
            const repo = bot.openSource ? `[**Github Repository**](${bot.openSource})\n` : ""
            const invite = bot.botInvite ? `[**Bot Invite**](${bot.botInvite})\n` : ""
            botEmbed
            .setAuthor("discord bots", "https://discord.bots.gg/img/logo_transparent.png", "https://discord.bots.gg/")
            .setTitle(`**Discord Bot Search** ${discord.getEmoji("raphi")}`)
            .setURL(`https://discord.bots.gg/bots/${bot.clientId}`)
            .setThumbnail(bot.avatarURL)
            .setDescription(
                `${discord.getEmoji("star")}_Bot:_ **${bot.username}#${bot.discriminator}**\n` +
                `${discord.getEmoji("star")}_Bot ID:_ \`${bot.clientId}\`\n` +
                `${discord.getEmoji("star")}_Owner:_ **${bot.owner.username}#${bot.owner.discriminator}**\n` +
                `${discord.getEmoji("star")}_Owner ID:_ \`${bot.owner.userId}\`\n` +
                `${discord.getEmoji("star")}_Prefix:_ **${bot.prefix}**\n` +
                `${discord.getEmoji("star")}_Library:_ **${bot.libraryName}**\n` +
                `${discord.getEmoji("star")}_Guilds:_ **${bot.guildCount}**\n` +
                `${discord.getEmoji("star")}_Added:_ **${Functions.formatDate(bot.addedDate)}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${bot.shortDescription}\n` +
                website + support + repo + invite
            )
            botArray.push(botEmbed)
        }

        if (botArray.length === 1) {
            message.channel.send(botArray[0])
        } else {
            embeds.createReactionEmbed(botArray)
        }
        return
    }
}
