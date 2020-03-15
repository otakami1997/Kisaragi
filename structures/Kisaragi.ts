import {Client, ClientOptions, Collection, Guild, GuildChannel, GuildEmoji, Message, TextChannel, User} from "discord.js"
import * as config from "./../config.json"
import {Embeds} from "./Embeds"
export class Kisaragi extends Client {
    private starIndex = 0
    constructor(options: ClientOptions) {
        super(options)
    }

    // Get Emoji
    public getEmoji = (name: string): GuildEmoji => {
        if (name === "star") {
            if (this.starIndex === 0) {
                this.starIndex = 1
            } else if (this.starIndex === 1) {
                name += "2"
                this.starIndex = 0
            }
        }
        const emoji = this.emojis.cache.find((e) => (e.name === name) && (e.guild.ownerID === process.env.OWNER_ID))
        if (emoji) {
            return emoji as unknown as GuildEmoji
        } else {
            // Confused Anime
            return this.emojis.cache.get("579870079311937557") as unknown as GuildEmoji
        }
    }

    // Fetch Message
    public fetchMessage = async (msg: Message, messageID: string) => {
        const channels = msg.guild!.channels.cache.map((c: GuildChannel) => {if (c.type === "text") return c as TextChannel})
        const msgArray: Message[] = []
        for (let i = 0; i < channels.length; i++) {
            const found = await channels[i]!.messages.fetch({limit: 1, around: messageID})
            if (found) msgArray.push(found.first() as Message)
        }
        const msgFound = msgArray.find((m: Message) => m.id === messageID)
        return msgFound
    }

    // Fetch Last Attachment
    public fetchLastAttachment = async <T extends boolean = false>(message: Message, author?: T, fileExt?: RegExp) =>  {
        if (!fileExt) fileExt = new RegExp(/.(png|jpg|gif)/)
        const msg = await message.channel.messages.fetch({limit: 100}).then((i) => i.find((m)=>m.attachments.size > 0))
        const image = msg?.attachments.find((a) => a.url.match(fileExt!) !== null)?.url
        if (author) return {image, author: msg?.author} as unknown as Promise<T extends true ? {image: string | undefined, author: User | undefined} : string | undefined>
        return image as unknown as Promise<T extends true ? {image: string | undefined, author: User | undefined} : string | undefined>
    }

    // Get an Invite
    public getInvite = async (guild: Guild | null) => {
        if (!guild) return "None"
        const invites = await guild.fetchInvites()
        let invite
        if (invites) {
            invite = invites.find((i)=>i.temporary === false)?.url
            if (!invite) invite = invites.first()?.url
        }
        if (!invite) invite = "None"
        return invite
    }

    // Fetch First Message in a Guild
    public fetchFirstMessage = async (guild: Guild) => {
        const channels = guild.channels.cache.filter((c: GuildChannel) => {
            if (c.type === "text") {
                let perms = c.permissionsFor(guild.id)!
                if (perms?.has("SEND_MESSAGES")) {
                    return true
                } else {
                    perms = c.permissionsFor(this.user?.id!)!
                    if (perms?.has("SEND_MESSAGES")) {
                        return true
                    }
                }
            }
            return false
        })
        const channel = channels.first() as TextChannel
        const lastMsg = await channel.messages.fetch({limit: 1}).then((c: Collection<string, Message>) => c.first())
        return lastMsg
    }

    // Check for Bot Mention
    public checkBotMention = (message: Message) => {
        if (message.author.id === this.user?.id) return false
        const regex = new RegExp(`<@!${this.user?.id}>`)
        if (message.content.match(regex)) return true
    }

    // Errors
    public cmdError = (msg: Message, error: Error) => {
        const embeds = new Embeds(this, msg)
        console.log(error)
        const messageErrorEmbed = embeds.createEmbed()
        messageErrorEmbed
        .setTitle(`**Command Error** ${this.getEmoji("maikaWut")}`)
        .setDescription(`There was an error executing this command:\n` +
        `**${error.name}: ${error.message}**\n` +
        `Please report this with the \`feedback\` command, or through any of the following links:\n` +
        `[Support Server](${config.support}), [Github Repository](${config.repo})`)
        return messageErrorEmbed
    }

}
