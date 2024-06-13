import { Bot, webhookCallback } from "grammy";
import { BiliArchiver } from "./api.js";
import Bvid from "../bv.js";
import resolveB23 from "./b23.js";
import * as MARKUP from "./markup.js";
import { env } from "$env/dynamic/private";

const token = env.BILIARCHIVER_BOT;
if (!token) {
  console.error("\x1b[31mBOT_TOKEN must be provided!\x1b[0m");
}
const bot = new Bot(token!);
const apiBase = env.BILIARCHIVER_API;
if (!apiBase) {
  throw new Error("\x1b[31mBILIARCHIVER_API must be provided!\x1b[0m");
}
const api = new BiliArchiver(new URL(apiBase));

bot.command("start", (ctx) =>
  ctx.reply(
    "向我发送 <code>/bili</code> 命令并跟随视频链接，我会进行正则匹配。\n" +
      "查询存档队列请使用 <code>/bilist</code> 命令。\n",
    {
      parse_mode: "HTML",
    }
  )
);
bot.command("help", (ctx) =>
  ctx.reply(
    "向我发送 <code>/bili</code> 命令并跟随视频链接，我会进行正则匹配。\n" +
      "查询存档队列请使用 <code>/bilist</code> 命令。\n",
    {
      parse_mode: "HTML",
    }
  )
);

const handleBiliLink = async (ctx, text) => {
  text = await resolveB23(text);
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

  const reply_markup =
    ctx.chat.type === "private" ? MARKUP.MINIAPP_PRIVATE : MARKUP.MINIAPP;

  (async () => {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    for (let i = 0; i < 30; i++) {
      await sleep(28000 + 4500 * i);
      const result = await api.check(bv);
      if (result.isSome()) {
        try {
          const url = result.unwrap().toString();
          await ctx.reply(
            `\u{1F389} Archive of ${bv} was done, item uploaded to\n${url}`,
            {
              reply_to_message_id: ctx.message.message_id,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "View archived",
                      url,
                    },
                  ],
                ],
              },
            }
          );
        } catch (e) {}
        return;
      }
    }
  })();
  (async () => {
    try {
      ctx.deleteMessages([pending.message_id]);
      if (success) {
        await ctx.reply(`Archive request ${bv} was successfully sent.`, {
          reply_to_message_id: ctx.message.message_id,
          reply_markup,
        });
      } else {
        await ctx.reply(`Archive request ${bv} failed.`, {
          reply_to_message_id: ctx.message.message_id,
          reply_markup,
        });
      }
    } catch (e) {
      return;
    }
  })();
};

bot.command("bili", async (ctx) => {
  // if (ctx.chat.id !== -1001773704746) {
  //   return;
  // }
  if (!ctx.message) {
    return;
  }
  let text = ctx.message.text;
  // @ts-ignore
  console.info(ctx.message.reply_to_message);
  // @ts-ignore
  if (ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
    // @ts-ignore
    text = ctx.message.reply_to_message.text + "\n" + text;
  }
  // console.log(ctx.message);
  await handleBiliLink(ctx, text);
});

bot.hears(/https:\/\/b23.tv\/\S+|https:\/\/www.bilibili.com\/video\/\S+/i, async (ctx) => {
  if (!ctx.message) {
    return;
  }
  let text = ctx.message.text;
  if (ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
    text = ctx.message.reply_to_message.text + "\n" + text;
  }
  await handleBiliLink(ctx, text);
});

bot.command("bilist", async (ctx) => {
  const queue = await api.queue();
  const text = queue.length
    ? `**${queue.length} items in queue pending or archiving:**\n${
        queue.length > 10 ? queue.slice(0, 10).join("\n") + "\nAnd " + (queue.length - 10) + " more" : queue.join("\n")
      }`
    : "**All items in queue have been archived**";
  const reply_markup =
    ctx.chat.type === "private" ? MARKUP.MINIAPP_PRIVATE : MARKUP.MINIAPP;
  await ctx.reply(text, {
    // reply_parameters: ctx.message.message_id,
    parse_mode: "MarkdownV2",
    reply_markup,
  });
});

export default bot;
