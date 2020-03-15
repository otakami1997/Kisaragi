import {Message} from "discord.js"
import fs from "fs"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Effects extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Applies special audio effects.",
            help:
            `
            \`effects\` - Opens the effects menu.
            `,
            examples:
            `
            \`=>effects\`
            `,
            aliases: ["fx"],
            cooldown: 20
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const msg = await audio.fxMenu()
        msg.delete()
        return
    }
}
