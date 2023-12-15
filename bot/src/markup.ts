import { InlineKeyboardMarkup } from "telegraf/types";
export const MINIAPP_PRIVATE: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: "View status",
          web_app: { url: "https://biliarchiverbot-miniapp.vercel.app/" },
        },
      ],
    ],
  };
  export const MINIAPP: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: "Check status",
          url: "https://t.me/lefetchbot/list"
        }
      ]
    ]
  }