import { InlineKeyboardMarkup } from "telegraf/types";
require('dotenv').config()
const bot_username = process.env.BILIARCHIVER_USERNAME;
let web_app_url = process.env.BILIARCHIVER_WEBAPP;
if (!bot_username) {
  throw new Error("\x1b[31mBILIARCHIVER_USERNAME must be provided!\x1b[0m");
}
if (!web_app_url) {
  web_app_url = "https://biliarchiverbot-miniapp.vercel.app/"
}
export const MINIAPP_PRIVATE: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: "View status",
          web_app: { url: web_app_url },
        },
      ],
    ],
  };
  export const MINIAPP: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: "Check status",
          url: `https://t.me/${bot_username}/list`,
        }
      ]
    ]
  }