import {Message} from "discord.js"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

const Kuroshiro = require("kuroshiro")
const KuromojiAnalyzer = require("kuroshiro-analyzer-kuromoji")

export default class Hiragana extends Command {
    constructor() {
        super({
            aliases: [],
            cooldown: 3
        })
    }

    public run = async (discord: Kisaragi, message: Message, args: string[]) => {
        const embeds = new Embeds(discord, message)
        const kuroshiro = new Kuroshiro()
        await kuroshiro.init(new KuromojiAnalyzer())

        const input = Functions.combineArgs(args, 1)
        const result = await kuroshiro.convert(input, {mode: "spaced", to: "hiragana"})
        const cleanResult = result.replace(/<\/?[^>]+(>|$)/g, "")

        const hiraganaEmbed = embeds.createEmbed()
        hiraganaEmbed
        .setAuthor("kuroshiro", "https://kuroshiro.org/kuroshiro.png")
        .setTitle(`**Hiragana Conversion** ${discord.getEmoji("kannaSip")}`)
        .setDescription(`${discord.getEmoji("star")}${cleanResult}`)
        message.channel.send(hiraganaEmbed)
    }
}
