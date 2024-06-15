import { Context } from "grammy";
import Bvid from "../bv.js";
import resolveB23 from "./b23.js";
import * as MARKUP from "./markup.js";
import { BiliArchiver } from "./api.js";
import { env } from "$env/dynamic/private";

const apiBase = env.BILIARCHIVER_API;
if (!apiBase) {
  throw new Error("\x1b[31mBILIARCHIVER_API must be provided!\x1b[0m");
}
const api = new BiliArchiver(new URL(apiBase));

const handleBiliLink = async (ctx: Context) => {
  if (!ctx.message) {
    return;
  }
  if (!ctx.message.text) {
    return;
  }
  if (!ctx.chat) {
    return;
  }
  let text = ctx.message.text;
  if (ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
    text = ctx.message.reply_to_message.text + "\n" + text;
  }
  text = await resolveB23(text);
  console.info("Resolved", text);
  const matches = /BV[a-zA-Z0-9]+/.exec(text);
  if (!matches) {
    return;
  }
  console.info("Regex matches", matches[0]);
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
          reply_markup,
        });
      } else {
        await ctx.reply(`Archive request ${bv} failed.`, {
          reply_markup,
        });
      }
    } catch (e) {
      return;
    }
  })();
};

export { handleBiliLink };
