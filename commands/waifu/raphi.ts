import {Message} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"
import {PixivApi} from "./../../structures/PixivApi"

export default class Raphi extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts pictures of raphiel.",
            help:
            `
            \`raphi\` - Posts raphiel pictures.
            `,
            examples:
            `
            \`=>raphi\`
            `,
            aliases: ["raphiel"],
            random: "none",
            cooldown: 10
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const pixiv = new PixivApi(discord, message)

        const pixivArray = await pixiv.animeEndpoint("raphi", 10)
        embeds.createReactionEmbed(pixivArray, true, true)
    }
}