import { Bot, Context, GrammyError, HttpError } from "grammy";
import { BiliArchiver } from "./api.js";
import * as MARKUP from "./markup.js";
import { isAdmin, addAdmin, removeAdmin, listAdmins } from "./admin.ts";
import {
  addToBlacklist,
  removeFromBlacklist,
  listBlacklist,
} from "./blacklist.ts";
import { env } from "$env/dynamic/private";
import { autoQuote } from "@roziscoding/grammy-autoquote";
import { autoRetry } from "@grammyjs/auto-retry";
import { handleBiliLink, BlockedMessage, parseTargetId } from "./utils.js";

// setup bot and api
const token = env.BILIARCHIVER_BOT;
if (!token) {
  console.error("\x1b[31mBOT_TOKEN must be provided!\x1b[0m");
}
const bot = new Bot(token!);
bot.use(autoQuote({ allowSendingWithoutReply: true }));
bot.api.config.use(
  autoRetry({
    maxRetryAttempts: 1,
    maxDelaySeconds: 5,
  })
);
const apiBase = env.BILIARCHIVER_API;
if (!apiBase) {
  throw new Error("\x1b[31mBILIARCHIVER_API must be provided!\x1b[0m");
}
const api = new BiliArchiver(new URL(apiBase));

bot.command("start", (ctx) =>
  ctx.reply(
    "请发送B站视频链接以存档 | Send a Bilibili video link to archive\n" +
      "🤖 BiliArchiver Bot 使用说明 | Usage Guide\n" +
      "请使用 /help 查看使用说明 | Use /help to view the usage guide",
    {
      parse_mode: "HTML",
    }
  )
);

bot.command("help", (ctx) =>
  ctx.reply(
    "🤖 BiliArchiver Bot 使用说明 | Usage Guide\n\n" +
      "<b>基础命令 | Basic Commands:</b>\n" +
      "• 直接发送B站视频链接/视频号 | Send Bilibili video link/BV or av number\n" +
      "• <code>/help</code> - 显示说明 | Show usage guide\n" +
      "• <code>/bili</code> - 存档视频 | Archive video\n" +
      "• <code>/bilist</code> - 查看队列 | Show queue\n" +
      "<b>支持的链接类型 | Supported Links:</b>\n" +
      "• BV号/av号视频 | BVxxxxxx or avxxxxxx\n" +
      "• 视频合集 | Series playlist\n" +
      "• 收藏夹 | Favorites list\n" +
      "• UP主投稿 | User uploads\n" +
      "• b23.tv短链接 | Short links\n" +
      "<b>其他 | Others:</b>\n" +
      "• 强烈推荐自行部署 | Highly recommend self-hosting\n" +
      "• 请勿滥用 | Do not abuse • 交流反馈 | <a href='https://t.me/saveweb_projects/208'>Telegram Group</a>\n" +
      "• TG端源码 | <a href='https://github.com/saveweb/biliarchiverbot'>TG GitHub</a> • 后端源码 | <a href='https://github.com/saveweb/biliarchiver'>Backend GitHub</a>",
    {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }
  )
);

bot.command("admin", (ctx) =>
  ctx.reply(
    "<b>管理员命令 | Admin Commands:</b>\n" +
      "• <code>/addadmin</code> [用户ID | user_id]\n" +
      "• <code>/removeadmin</code> [用户ID | user_id]\n" +
      "• <code>/blacklist</code> [用户ID | user_id]\n" +
      "• <code>/unblacklist</code> [用户ID | user_id]\n\n" +
      "• <code>/listadmins</code> - 查看管理员 | Show admins\n" +
      "• <code>/listblacklist</code> - 查看黑名单 | Show blacklist\n",
    {
      parse_mode: "HTML",
    }
  )
);

bot.command("bili", async (ctx) => {
  await handleBiliLink(ctx, true);
});
bot.hears(
  /(BV[a-zA-Z0-9]+)|(av\d+)|(bili2233.cn|b23\.(tv|wtf))\/\S+|www\.bilibili\.com\/(video|medialist|list)\/\S+|space\.bilibili\.com\/\d+/i,
  async (ctx) => {
    await handleBiliLink(ctx, false);
  }
);

bot.command("bilist", async (ctx) => {
  const queue = await api.queue();
  const text = queue.length
    ? `**${queue.length} items in queue pending or archiving:**\n${
        queue.length > 10
          ? queue.slice(0, 10).join("\n") +
            "\nAnd " +
            (queue.length - 10) +
            " more"
          : queue.join("\n")
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

const handleAdminCommand = async (
  ctx: Context,
  action: (id: number) => void,
  successMsg: (id: number) => string
) => {
  console.log(
    "Admin command received from id " +
      (ctx.from && ctx.from.id + " " + ctx.from.username) +
      ", uses " +
      action.name +
      ", resulting " +
      successMsg(0)
  );
  if (env.BILIARCHIVER_ENABLE_BLACKLIST !== "true") {
    await ctx.reply("Admin functionality is not enabled");
    return;
  }

  const senderId = ctx.from?.id;
  if (!senderId) return;

  const targetId = parseTargetId(ctx);

  if (!isAdmin(senderId)) {
    if (action === addAdmin && listAdmins().length === 0) {
      addAdmin(senderId);
      await ctx.reply("You are now the first admin.");
    }
    return;
  }

  if (!targetId || isNaN(targetId)) {
    await ctx.reply("Please provide a valid user ID");
    return;
  }

  action(targetId);
  await ctx.reply(successMsg(targetId));
};

bot.command("addadmin", (ctx) =>
  handleAdminCommand(ctx, addAdmin, (id) => `Added ${id} as admin.`)
);

bot.command("removeadmin", (ctx) =>
  handleAdminCommand(ctx, removeAdmin, (id) => `Removed ${id} from admin.`)
);

bot.command("listadmins", async (ctx) => {
  const Admins = listAdmins();
  const adminMentions = Admins.map((id) => `[${id}](tg://user?id=${id})`);
  await ctx.reply(`Admins: ${adminMentions.join("; ")}`, {
    parse_mode: "MarkdownV2",
  });
});

bot.command("blacklist", async (ctx) =>
  handleAdminCommand(
    ctx,
    addToBlacklist,
    (id) => `User ${id} has been blacklisted.`
  )
  .then(async () => {
    await ctx.api.sendMessage(
      parseTargetId(ctx),
      BlockedMessage(),
      { parse_mode: "MarkdownV2" }
    );
  })
);

bot.command("unblacklist", async (ctx) =>
  handleAdminCommand(
    ctx,
    removeFromBlacklist,
    (id) => `User ${id} has been removed from blacklist.`
  )
);

bot.command("listblacklist", async (ctx) => {
  const blacklist = listBlacklist();
  const blacklistMentions = blacklist.map(
    (id) => `\n<a href="tg://user?id=${id}">${id}</a>`
  );
  await ctx.reply(`Blacklisted users: ${blacklistMentions.join("; ")}`, {
    parse_mode: "HTML",
  });
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

export default bot;
