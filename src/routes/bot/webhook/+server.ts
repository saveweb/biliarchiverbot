import type { RequestHandler } from "./$types";
import { webhookCallback } from "grammy";
import bot from "$lib/server/index.js";

const webhook = webhookCallback(bot, "sveltekit");

export const POST: RequestHandler = async (event: any) => {
  return webhook(event);
};