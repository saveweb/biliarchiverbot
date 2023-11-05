import { Telegraf } from "telegraf";
import { BiliArchiver } from "./api";
import Bvid from "./bv";

const token = process.env.BILIARCHIVERBOT;
if (!token) {
  console.error("\x1b[31mBOT_TOKEN must be provided!\x1b[0m");
  process.exit(1);
}
const bot = new Telegraf(token);
const api = new BiliArchiver(new URL("http://hz1.server.saveweb.org:41835/"));

bot.command("start", Telegraf.reply("向我发送 BV 号以存档视频。"));
bot.help((ctx) => ctx.reply("向我发送 BV 号以存档视频。我会进行正则匹配。"));

bot.command("bili", async (ctx) => {
  // if (ctx.chat.id !== -1001773704746) {
  //   return;
  // }
  let text = ctx.message.text;
  // @ts-ignore
  if (ctx.message.reply_to_message && ctx.message.reply_to_message["text"]) {
    // @ts-ignore
    text = ctx.message.reply_to_message["text"] + "\n" + text;
  }
  console.log(text);
  const matches = /BV[a-zA-Z0-9]+/i.exec(text);
  if (!matches) {
    return;
  }
  const bv = new Bvid(matches[0]);
  console.log("Found", ctx.chat.id, ctx.message.text);
  let pending;
  try {
    pending = await ctx.reply("正在发送请求……", {
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (e) {
    return;
  }

  const success = await api.add(bv);
  (async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    for (let i = 0; i < 15; i++) {
      await sleep(20000 + 2500 * i);
      const result = await api.check(bv);
      if (result.isSome()) {
        try {
          await ctx.reply(`🎉 Archive of ${bv} was done, item uploaded to\n${result.unwrap()}`, {
            reply_to_message_id: ctx.message.message_id,
          });
        } catch (e) { }
        return;
      }
    }
  })();
  (async () => {
    try {
      ctx.deleteMessage(pending.message_id);
      if (success) {
        await ctx.reply(`Archive request ${bv} was successfully sent.`, {
          reply_to_message_id: ctx.message.message_id,
        });
      } else {
        await ctx.reply(`Archive request ${bv} failed.`, {
          reply_to_message_id: ctx.message.message_id,
        });
      }
    } catch (e) {
      return;
    }
  })();
});

bot.command("bilist", async (ctx) => {
  const queue = await api.queue();
  const text = queue.length
    ? `**${queue.length} items in queue pending or archiving:**\n\n${queue.join(
      "\n"
    )}`
    : "**All items in queue has been archived**";
  await ctx.replyWithMarkdownV2(text, {
    reply_to_message_id: ctx.message.message_id,
  });
});
console.log("Start running…");
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
