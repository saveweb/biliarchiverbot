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
    // season
    // https://space.bilibili.com/38505812/channel/collectiondetail?sid=518558 518558
    // https://space.bilibili.com/228147/favlist?fid=157228&ftype=collect&ctype=21 157228
    const seasonmatches = /\/collectiondetail\?sid=(\d+)|\/favlist\?fid=(\d+)&ftype=collect&ctype=21/.exec(text);
    if (seasonmatches) {
      console.info(seasonmatches);
      console.info("Season matches", seasonmatches[1] || seasonmatches[2]);
      handle_source(ctx, "season", seasonmatches[1] || seasonmatches[2]);
      return;
    }

    // https://www.bilibili.com/medialist/detail/ml480798947?type=1
    // https://www.bilibili.com/medialist/play/ml480798947
    // https://www.bilibili.com/list/ml480798947
    // https://space.bilibili.com/365743248/favlist?fid=2927461681&ftype=collect&ctype=11
    const listmatches = /\/(play|list|detail)\/ml(\d+)|\/favlist\?fid=(\d+)/.exec(text);
    if (listmatches) {
      console.info("List matches", listmatches[2] || listmatches[3]);
      handle_source(ctx, "favlist", listmatches[2] || listmatches[3]);
      return;
    }

    // series
    // https://www.bilibili.com/list/617813050?sid=518558&desc=1 518558
    // https://space.bilibili.com/617813050/channel/seriesdetail?sid=518558&ctype=0 518558 yes
    const seriesmatches = /\/list\/(\d+)\?sid=(\d+)|com\/(\d+)\/channel\/seriesdetail\?sid=(\d+)/.exec(text);
    if (seriesmatches) {
      console.info("Series matches", seriesmatches[2] || seriesmatches[4]);
      handle_source(ctx, "series", seriesmatches[2] || seriesmatches[4]);
      return;
    }

    // up_videos
    // https://space.bilibili.com/38505812
    // https://www.bilibili.com/list/228147
    const uidmatches = /space\.bilibili\.com\/(\d+)|\/list\/(\d+)/.exec(text);
    if (uidmatches) {
      console.info("UID matches", uidmatches[1] || uidmatches[2]);
      handle_source(ctx, "up_videos", uidmatches[1] || uidmatches[2]);
      return;
    }
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

const source_to_link = (source_type: string, source_id: string) => {
  switch (source_type) {
    case "season":
      return `https://space.bilibili.com/1/channel/collectiondetail?sid=${source_id}`;
    case "favlist":
      return `https://space.bilibili.com/list/ml${source_id}`;
    case "series":
      return `https://space.bilibili.com/list/${source_id}?sid=${source_id}`;
    case "up_videos":
      return `https://space.bilibili.com/u/${source_id}`;
    default:
      return "";
  }
}

const source_to_name = (source_type: string) => {
  switch (source_type) {
    case "season":
      return "season";
    case "favlist":
      return "favlist";
    case "series":
      return "series";
    case "up_videos":
      return "up videos";
    default:
      return "";
  }
}

const handle_source = async (ctx: Context, source_type: string, source_id: string) => {
  if (!ctx.message) {
    return;
  }
  if (!ctx.message.text) {
    return;
  }
  if (!ctx.chat) {
    return;
  }

  const chat_id = ctx.chat.id;
  const chat_type = ctx.chat.type;

  const reply_markup =
    ctx.chat.type === "private" ? MARKUP.MINIAPP_PRIVATE : MARKUP.MINIAPP;

  let statusMessage = await ctx.reply(
    `Getting items from [${source_to_name(source_type)} ${source_id}](${source_to_link(source_type, source_id)})`,
    { parse_mode: "MarkdownV2" }
  );

  const statusMessageId = statusMessage.message_id;

  const bvids = await api.add_from_source(source_type, source_id);

  let existingCount = 0;
  let newCount = 0;
  let processingCount = 0;
  let processedCount = 0;
  let newlyDoneCount = 0;
  let newBvids: string[] = [];
  let lastMessageText = '';
  let lastOptions: any = {};
  const progress = await api.getitems();
  const allBvids = progress.map(item => item.bvid);
  console.debug(`All BVIDs: ${allBvids.join(', ')}`);
  
  const unprocessedBvids = bvids.filter(bvid => !allBvids.includes(bvid));
  console.debug(`Unprocessed BVIDs: ${unprocessedBvids.join(', ')}`);
  processingCount = bvids.length - unprocessedBvids.length; // 正在后台处理的BVID数量
  console.debug(`Processing BVIDs: ${bvids.length - unprocessedBvids.length}`); 
  newBvids = bvids.filter(bvid => !unprocessedBvids.includes(bvid));

  const updateStatus = async () => {
    try {
      const messageText = `Processing [${source_to_name(source_type)} ${source_id}](${source_to_link(source_type, source_id)})\n` +
        `Total: ${bvids.length}\n` +
        `${existingCount > 0 ? `Archived: ${existingCount}\n` : ''}` +
        `${newCount > 0 ? `Nonexist: ${newCount}\n` : ''}` +
        `${processingCount > 0 ? `Added before: ${processingCount}\n` : ''}` +
        `${processedCount > 0 ? `Added now: ${processedCount}\n` : ''}`;

      let options: any = { parse_mode: "MarkdownV2" };
      if (newCount > 0) {
        options.reply_markup = reply_markup;
      }

      if (messageText === lastMessageText && JSON.stringify(options) === JSON.stringify(lastOptions)) {
        return; // 如果消息没有变化，直接返回
      }

      await ctx.api.editMessageText(
        chat_id,
        statusMessageId,
        messageText,
        options
      );

      lastMessageText = messageText;
      lastOptions = options;
    } catch (e) {
      console.error("Failed to update status message:", e);
    }
  };

  const BATCH_SIZE = 10;
  await updateStatus();

  for (let i = 0; i < unprocessedBvids.length; i += BATCH_SIZE) {
    const batch = unprocessedBvids.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.all(
      batch.map(bvid => api.check(new Bvid(bvid)))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const bvid = batch[j];

      if (result.isSome()) {
        existingCount++;
      } else {
        newCount++;
        newBvids.push(bvid);
        await api.add(new Bvid(bvid));
        processedCount++;
      }
    }
    if (
      (chat_type === "private" && processedCount % 1 === 0) ||
      (chat_type !== "private" && processedCount % 6 === 0) ||
      processedCount === unprocessedBvids.length
    ) {
      await updateStatus();
    }
  }

  await updateStatus();

  if (newBvids.length === 0) {
    await ctx.api.editMessageText(
      chat_id,
      statusMessageId,
      `Processed all ${bvids.length} items from [${source_to_name(source_type)} ${source_id}](${source_to_link(source_type, source_id)})\n` +
      `${bvids.length} items already existed.\n` +
      `No new items found.`,
      { parse_mode: "MarkdownV2" }
    );
    return;
  }

  await ctx.api.editMessageText(
    chat_id,
    statusMessageId,
    `Processed all ${bvids.length} items from source [${source_to_name(source_type)} ${source_id}](${source_to_link(source_type, source_id)})\n` +
    `${bvids.length - newBvids.length} items already existed\n` +
    `Added ${newBvids.length} new items\n` +
    `Now monitoring new archives`,
    { reply_markup , parse_mode: "MarkdownV2" }
  );

  let remainingBvids = newBvids.slice();
  let completedBvids: string[] = [];
  let checked_turns = 0;

  const checkArchives = async () => {
    let newlyCompleted = [];
    const progress = await api.getitems();
    let allCompleted = progress.filter(item => item.status === 'finished').map(item => item.bvid);
    newlyCompleted = allCompleted.filter(bvid => remainingBvids.includes(bvid));
    if (newlyCompleted.length > 0) {
      console.debug(`Archive of ${newlyCompleted.length} BVIDs completed: ${newlyCompleted.join(', ')}`);
    }
    remainingBvids = remainingBvids.filter(bvid => !newlyCompleted.includes(bvid));
    completedBvids.push(...newlyCompleted);
    newlyDoneCount += newlyCompleted.length;
    let progressText : string = '';
    if (remainingBvids.length === 0) {
      await ctx.reply(`All items have been processed.`);
      return;
    } else {
      let messageText = lastMessageText +
        `${remainingBvids.length > 0 ?
          `Archiving: ${remainingBvids.length}\n` +
          `Bili links: ${remainingBvids.length <= 5 ?
          `${remainingBvids.map(bvid => new Bvid(bvid).toMarkdownBilibiliLink()).join(', ')}\n` :
          `${remainingBvids.slice(0, 5).map(bvid => new Bvid(bvid).toMarkdownBilibiliLink()).join(', ')} and ${remainingBvids.length - 5} more \n`}`
          : ''}` +
        `${newlyDoneCount > 0 ?
          `Newly done: ${newlyDoneCount}\n` +
          `Archive links: ${completedBvids.length <= 5 ?
          `${completedBvids.map(bvid => new Bvid(bvid).toMarkdownArchiveLink()).join(', ')}\n` :
          `${completedBvids.slice(0, 5).map(bvid => new Bvid(bvid).toMarkdownArchiveLink()).join(', ')} and ${completedBvids.length - 5} more \n`}`
          : ''}` +
        `Checking in 20 minutes\n`
      if (messageText === progressText) {
        return;
      } else {
        await ctx.api.editMessageText(
          chat_id,
          statusMessageId,
          messageText,
          { reply_markup , parse_mode: "MarkdownV2" }
        );
        progressText = messageText;
      }
    }

    checked_turns++;

    if (remainingBvids.length > 0 && checked_turns < 30) {
      setTimeout(checkArchives, 1200000); // 20 minutes
    } else if (remainingBvids.length === 0) {
      await ctx.reply(`All items have been processed.`, {
        reply_markup,
      });
      return;
    } else {
      let message = `Processed all ${bvids.length} items\\.\n` +
        `${completedBvids.length > 0 ? `Archive links: ${completedBvids.map(bvid => new Bvid(bvid).toMarkdownArchiveLink()).join('\n')}\n` : ''}` +
        `Remaining items: ${remainingBvids.length}\n` +
        `Some items have not been processed yet after 30 checks, they are: ` + 
        `${remainingBvids.map(bvid => new Bvid(bvid).toMarkdownBilibiliLink()).join(', ')}`;

      await ctx.api.editMessageText(
        chat_id,
        statusMessageId,
        message,
        { parse_mode: "MarkdownV2",reply_markup:reply_markup }
      );
      return;
    }
  };

  checkArchives();
};

export { handleBiliLink };
