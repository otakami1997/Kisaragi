"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const booru_1 = __importDefault(require("booru"));
const Command_1 = require("../../structures/Command");
const Embeds_1 = require("./../../structures/Embeds");
const Functions_1 = require("./../../structures/Functions");
class Yandere extends Command_1.Command {
    constructor(kisaragi) {
        super(kisaragi, {
            aliases: [],
            cooldown: 3
        });
        this.run = (discord, message, args) => __awaiter(this, void 0, void 0, function* () {
            const embeds = new Embeds_1.Embeds(discord, message);
            const yandere = booru_1.default("yande.re", process.env.yandere_API_KEY);
            const yandereEmbed = embeds.createEmbed();
            const axios = require("axios");
            let tags;
            if (!args[1]) {
                tags = ["rating:safe"];
            }
            else if (args[1].toLowerCase() === "r18") {
                tags = Functions_1.Functions.combineArgs(args, 2).split(",");
                tags.push("-rating:safe");
            }
            else {
                tags = Functions_1.Functions.combineArgs(args, 1).split(",");
                tags.push("rating:safe");
            }
            if (!tags.join(" ")) {
                yandereEmbed
                    .setAuthor("yandere", "https://i.imgur.com/5DiQTnW.pngE")
                    .setTitle(`**Yandere Search** ${discord.getEmoji("gabLewd")}`)
                    .setDescription("No results were found. Underscores are not required, " +
                    "if you want to search multiple terms separate them with a comma. Tags usually start with a last name, try looking up your tag " +
                    "on the yandere website.\n" + "[yandere Website](https://yande.re//)");
                message.channel.send(yandereEmbed);
                return;
            }
            const tagArray = [];
            for (let i = 0; i < tags.length; i++) {
                tagArray.push(tags[i].trim().replace(/ /g, "_"));
            }
            let url;
            if (tags.join("").match(/\d\d+/g)) {
                url = `https://yande.re/post/show/${tags.join("").match(/\d+/g)}/`;
            }
            else {
                const image = yield yandere.search(tagArray, { limit: 1, random: true });
                url = yandere.postView(image[0].id);
            }
            const id = url.match(/\d+/g).join("");
            const result = yield axios.get(`https://yande.re/post/index.json?tags=id:${id}`);
            const img = result.data[0];
            console.log(img);
            yandereEmbed
                .setAuthor("yandere", "https://i.imgur.com/5DiQTnW.png")
                .setURL(url)
                .setTitle(`**Yandere Image** ${discord.getEmoji("gabLewd")}`)
                .setDescription(`${discord.getEmoji("star")}_Source:_ ${img.source}\n` +
                `${discord.getEmoji("star")}_Uploader:_ **${img.author}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions_1.Functions.formatDate(new Date(img.created_at * 1000))}**\n` +
                `${discord.getEmoji("star")}_Tags:_ ${Functions_1.Functions.checkChar(img.tags, 1900, " ")}\n`)
                .setImage(img.sample_url.replace(/ /g, ""));
            message.channel.send(yandereEmbed);
        });
    }
}
exports.default = Yandere;
//# sourceMappingURL=yandere.js.map