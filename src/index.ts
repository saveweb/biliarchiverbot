import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { BiliArchiver } from "./api"

const token = process.env.BILIARCHIVERBOT;
if (!token) {
  console.error('\x1b[31mBOT_TOKEN must be provided!\x1b[0m');
  process.exit(1);
}
const bot = new Telegraf(token)
const api = new BiliArchiver(new URL("http://hz1.server.saveweb.org:41835/"))

bot.command('start', Telegraf.reply('向我发送 BV 号以存档视频。'))
bot.help((ctx) => ctx.reply('向我发送 BV 号以存档视频。我会进行正则匹配。'))

bot.command("bili", async (ctx) => {
  let text = ctx.message.text;
  // @ts-ignore
  if (ctx.message.reply_to_message && ctx.message.reply_to_message["text"]) {
    // @ts-ignore
    text = ctx.message.reply_to_message["text"] + "\n" + text;
  }
  console.log(text)
  const matches = /^BV[a-zA-Z0-9]+$/i.exec(text);
  if (!matches) {
    return;
  }
  console.log(ctx.chat.id, ctx.message.text)
  let pending;
  try {
    pending = await ctx.reply("正在发送请求……", {
      reply_to_message_id: ctx.message.message_id,
    })
  } catch (e) {
    return
  }

  const bv = matches[0];
  const success = await api.archive(bv);
  (async () => {
    try {
      ctx.deleteMessage(pending.message_id)
      if (success) {
        await ctx.reply(`存档 ${bv} 成功`, {
          reply_to_message_id: ctx.message.message_id,
        });
      } else {
        await ctx.reply(`存档 ${bv} 失败`, {
          reply_to_message_id: ctx.message.message_id,
        });
      }
    } catch (e) {
      return
    }
  })();
})
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
