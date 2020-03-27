import type {GuildEmoji, Message, MessageEmbed} from "discord.js"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class ReactionRoles extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Configures settings for reaction roles.",
            help:
            `
            \`reactionroles\` - Opens the reaction roles prompt
            \`reactionroles [messageID]? @role/rolename? emoji? dm?\` - Adds a new reaction role with the parameters
            \`reactionroles delete setting\` - Removes a reaction role
            \`reactionroles edit setting [messageID]? @role/rolename? emoji? dm?\` - Edits a reaction role
            \`reactionroles toggle setting\` - Toggles the reaction role on or off
            \`reactionroles reset\` - Deletes all reaction roles.
            `,
            examples:
            `
            \`=>reactionroles\`
            \`=>reactionroles edit 1 [messageID] weebs :anime:\`
            \`=>reactionroles delete 5\`
            `,
            aliases: ["rr"],
            guildOnly: true,
            cooldown: 15
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        const input = Functions.combineArgs(args, 1)
        if (input.trim()) {
            message.content = input.trim()
            reactPrompt(message)
            return
        }

        const reactions = await sql.fetchColumn("special roles", "reaction roles")
        const step = 3.0
        const increment = Math.ceil((reactions ? reactions.length : 1) / step)
        const reactArray: MessageEmbed[] = []
        for (let i = 0; i < increment; i++) {
            let settings = ""
            for (let j = 0; j < step; j++) {
                if (reactions) {
                    const value = (i*step)+j
                    if (!reactions[value]) break
                    const reaction = JSON.parse(reactions[value])
                    const foundMsg = await discord.fetchMessage(message, reaction.message)
                    const link = foundMsg ? `[**Link**](${foundMsg?.url})` : "None"
                    settings += `${value + 1} **=>**\n` +
                    `${discord.getEmoji("star")}_Message:_ ${link}\n` +
                    `${discord.getEmoji("star")}_Emoji:_ ${reaction.emoji ?? "None"}\n` +
                    `${discord.getEmoji("star")}_Role:_ <@&${reaction.role ?? "None"}>\n` +
                    `${discord.getEmoji("star")}_DM:_ **${reaction.dm ?? "off"}**\n` +
                    `${discord.getEmoji("star")}_State:_ **${reaction.state ?? "off"}**\n`
                } else {
                    settings = "None"
                }
            }
            const reactEmbed = embeds.createEmbed()
            reactEmbed
            .setTitle(`**Reaction Roles** ${discord.getEmoji("tohruThumbsUp2")}`)
            .setThumbnail(message.guild!.iconURL({format: "png", dynamic: true})!)
            .setDescription(Functions.multiTrim(`
                Add and remove reaction roles.
                newline
                __Current Settings__
                ${settings}
                newline
                __Edit Settings__
                ${discord.getEmoji("star")}Type a **[message id] between brackets** to set the message.
                ${discord.getEmoji("star")}**Mention a role or type a role id** to set the role.
                ${discord.getEmoji("star")}**Send an emoji or emoji name** to set the emoji.
                ${discord.getEmoji("star")}Type **dm** to toggle dm notifications.
                ${discord.getEmoji("star")}Type **delete (setting number)** to delete a setting.
                ${discord.getEmoji("star")}Type **edit (setting number)** to edit a setting.
                ${discord.getEmoji("star")}Type **toggle (setting number)** to toggle the state.
                ${discord.getEmoji("star")}Type **reset** to delete all settings.
                ${discord.getEmoji("star")}Type **cancel** to exit.
            `))
            reactArray.push(reactEmbed)
        }
        if (reactArray.length > 1) {
            embeds.createReactionEmbed(reactArray)
        } else {
            message.channel.send(reactArray[0])
        }

        async function reactPrompt(msg: Message) {
            const responseEmbed = embeds.createEmbed()
            .setTitle(`**Reaction Roles** ${discord.getEmoji("tohruThumbsUp2")}`)
            let reactionroles = await sql.fetchColumn("special roles", "reaction roles")
            if (!reactionroles) reactionroles = []
            let [setToggle, setMessage, setEmoji, setRole, setDM] = [false, false, false, false, false]

            if (msg.content.toLowerCase() === "cancel") {
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Canceled the prompt!`)
                return msg.channel.send(responseEmbed)
            }
            if (msg.content.toLowerCase() === "reset") {
                await sql.updateColumn("special roles", "reaction roles", null)
                responseEmbed
                .setDescription(`${discord.getEmoji("star")}Reaction role settings were wiped!`)
                return msg.channel.send(responseEmbed)
            }
            if (msg.content.toLowerCase().includes("delete")) {
                const num = Number(msg.content.replace(/delete/gi, "").replace(/\s+/g, ""))
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (reactionroles ? reactionroles[num - 1] : false) {
                    reactionroles[num - 1] = ""
                    reactionroles = reactionroles.filter(Boolean)
                    await sql.updateColumn("special roles", "reaction roles", reactionroles)
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting ${num} was deleted!`)
                    return msg.channel.send(responseEmbed)
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    return msg.channel.send(responseEmbed)
                }
            }

            if (msg.content.toLowerCase().includes("toggle")) {
                const num = Number(msg.content.replace(/toggle/gi, "").replace(/\s+/g, ""))
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (reactionroles ? reactionroles[num - 1] : false) {
                    let desc = ""
                    const reaction = JSON.parse(reactionroles[num - 1])
                    if (reaction?.state === "on") {
                        reaction.state = "off"
                        desc = `${discord.getEmoji("star")}Setting ${num} was toggled **off**!`
                    } else {
                        if (reaction.message && reaction.emoji && reaction.role) {
                            reaction.state = "on"
                            desc = `${discord.getEmoji("star")}Setting ${num} was toggled **on**!`
                        } else {
                            desc = `${discord.getEmoji("star")}You need to set the message, role, and emoji to toggle this setting on!`
                        }
                    }
                    reactionroles[num-1] = JSON.stringify(reaction)
                    await sql.updateColumn("special roles", "reaction roles", reactionroles)
                    responseEmbed
                    .setDescription(desc)
                    return msg.channel.send(responseEmbed)
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    return msg.channel.send(responseEmbed)
                }
            }

            if (msg.content.toLowerCase().includes("edit")) {
                const newMsg = msg.content.replace(/edit/g, "").trim().split(" ")
                const tempMsg = newMsg.slice(1).join(" ")
                const num = Number(newMsg[0]) - 1
                if (Number.isNaN(num)) return msg.reply("Invalid setting number!")
                if (reactionroles ? reactionroles[num] : false) {
                    if (tempMsg) {
                        const reaction = JSON.parse(reactionroles[num])
                        const nDM = tempMsg.match(/dm/)?.[0] ?? ""
                        const nMessage = tempMsg.match(/(?<=\[)(.*?)(?=\])/g)?.[0] ?? ""
                        const nEmoji = msg.content.match(/(<a?:)(.*?)(>)/)?.[0] ?? Functions.unicodeEmoji(msg.content) ?? ""
                        let nRole = msg.content.replace(nMessage, "").replace(nEmoji, "").match(/\d{5,}/)?.[0] ?? msg.content.match(/(?<=<@&)(.*?)(?=>)/g)?.[0] ?? ""
                        if (!nRole) {
                            const roleName = msg.content?.replace(/toggle/, "").replace(/dm/, "").replace(nEmoji, "").replace(/(\[)(.*?)(\])/g, "").replace(/(<@&)(.*?)(>)/g, "")?.trim()
                            const roleSearch = message.guild?.roles.cache.find((r) => r.name.toLowerCase().includes(roleName.toLowerCase()))?.id
                            if (roleSearch) {
                                nRole = roleSearch
                            }
                        }
                        let editDesc = ""
                        if (nMessage) {
                            const foundMsg = await discord.fetchMessage(message, nMessage)
                            if (!foundMsg) return message.reply(`Invalid message ${discord.getEmoji("kannaFacepalm")}`)
                            reaction.message = nMessage
                            editDesc += `${discord.getEmoji("star")}Message set to [**Link**](${foundMsg.url})!\n`
                        }
                        if (nEmoji) {
                            reaction.emoji = nEmoji
                            editDesc += `${discord.getEmoji("star")}Emoji set to ${nEmoji}!\n`
                        }
                        if (nRole) {
                            reaction.role = nRole
                            editDesc += `${discord.getEmoji("star")}Role set to <@&${nRole}>!\n`
                        }
                        if (nDM) {
                            if (reaction.dm === "on") {
                                reaction.dm = "off"
                                editDesc += `${discord.getEmoji("star")}DM notifications are **off**!\n`
                            } else {
                                reaction.dm = "on"
                                editDesc += `${discord.getEmoji("star")}DM notifications are **on**!\n`
                            }
                        }
                        if ((reaction.state === "off") && (reaction.message && reaction.emoji && reaction.role)) {
                            reaction.state = "on"
                            editDesc += `${discord.getEmoji("star")}State is **on**!\n`
                        }
                        if (reaction.message && reaction.emoji) {
                            const foundMsg = await discord.fetchMessage(message, nMessage)
                            const id = nEmoji.match(/\d{10,}/) ? nEmoji.match(/\d{10,}/)![0] : nEmoji
                            if (!foundMsg!.reactions.cache.get(id)) {
                                await foundMsg?.react(id)
                                editDesc += `${discord.getEmoji("star")}This message didn't have this reaction, so I added it! (You can remove it and add it yourself, if you wish).\n`
                            }
                        }
                        reactionroles[num] = JSON.stringify(reaction)
                        await sql.updateColumn("special roles", "reaction roles", reactionroles)
                        responseEmbed
                        .setDescription(editDesc)
                        return msg.channel.send(responseEmbed)
                    } else {
                        return msg.channel.send(responseEmbed.setDescription("No edits specified!"))
                    }
                } else {
                    responseEmbed
                    .setDescription(`${discord.getEmoji("star")}Setting not found!`)
                    msg.channel.send(responseEmbed)
                    return
                }
            }

            const newDM = msg.content.match(/dm/)?.[0] ?? ""
            const newToggle = msg.content.match(/toggle/)?.[0] ?? ""
            const newMessage = msg.content.match(/(?<=\[)(.*?)(?=\])/g)?.[0] ?? ""
            const newEmoji = msg.content.match(/(<a?:)(.*?)(>)/)?.[0] ?? Functions.unicodeEmoji(msg.content) ?? ""
            let newRole = msg.content.replace(newMessage, "").replace(newEmoji, "").match(/\d{5,}/)?.[0] ?? msg.content.match(/(?<=<@&)(.*?)(?=>)/g)?.[0] ?? ""
            if (!newRole) {
                const roleName = msg.content?.replace(/toggle/, "").replace(/dm/, "").replace(newEmoji, "").replace(/(\[)(.*?)(\])/g, "").replace(/(<@&)(.*?)(>)/g, "")?.trim()
                const roleSearch = message.guild?.roles.cache.find((r) => r.name.toLowerCase().includes(roleName.toLowerCase()))?.id
                if (roleSearch) {
                    newRole = roleSearch
                }
            }
            if (newToggle) setToggle = true
            if (newMessage) setMessage = true
            if (newEmoji) setEmoji = true
            if (newRole) setRole = true
            if (newDM) setDM = true

            let description = ""
            const obj = {} as any

            if (setMessage) {
                const foundMsg = await discord.fetchMessage(message, newMessage)
                if (!foundMsg) return message.reply(`Invalid message ${discord.getEmoji("kannaFacepalm")}`)
                obj.message = newMessage
                description += `${discord.getEmoji("star")}Message set to [**Link**](${foundMsg.url})!\n`
            }

            if (setEmoji) {
                obj.emoji = newEmoji
                description += `${discord.getEmoji("star")}Emoji set to ${newEmoji}!\n`
            }

            if (setRole) {
                obj.role = newRole
                description += `${discord.getEmoji("star")}Role set to <@&${newRole}>!\n`
            }

            if (setDM) {
                obj.dm = "on"
                description += `${discord.getEmoji("star")}DM notifications are **on**!\n`
            } else {
                obj.dm = "off"
            }

            if (setMessage && setEmoji && setRole) {
                obj.state = "on"
                description += `${discord.getEmoji("star")}State is **on**!\n`
            } else {
                obj.state = "off"
            }

            if (setToggle && !(setMessage && setEmoji && setRole)) {
                description += `${discord.getEmoji("star")}You need to set the message, emoji, and role to turn on the state!\n`
            }

            if (setMessage && setEmoji) {
                const foundMsg = await discord.fetchMessage(message, newMessage)
                const id = newEmoji.match(/\d{10,}/) ? newEmoji.match(/\d{10,}/)![0] : newEmoji
                if (!foundMsg!.reactions.cache.get(id)) {
                    await foundMsg?.react(id)
                    description += `${discord.getEmoji("star")}This message didn't have this reaction, so I added it! (You can remove it and add it yourself, if you wish).\n`
                }
            }

            if (!description) return msg.reply(`No additions were made, canceled ${discord.getEmoji("kannaFacepalm")}`)
            reactionroles.push(obj)
            await sql.updateColumn("special roles", "reaction roles", reactionroles)

            responseEmbed
            .setDescription(description)
            return msg.channel.send(responseEmbed)
        }

        embeds.createPrompt(reactPrompt)
    }
}
