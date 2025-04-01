# biliarchiverbot

## Configuration & Data Storage

> ⚠️ Note: File-based storage requires a persistent filesystem. This will NOT work on Vercel or similar serverless platforms. Use Docker or local deployment for admin/blacklist features.

The bot stores configuration in the `config` directory:
- `admins.json`: Admin user IDs
- `blacklist.json`: Blocked user IDs

## Using Docker

``` shell
docker run -d \
  --name biliarchiverbot \
  -p 5173:5173 \
  -v $(pwd)/config:/app/config \
  -e BILIARCHIVER_WEBAPP={THE_DEPLOYED_WEBAPP_URL}\
  -e BILIARCHIVER_USERNAME={THE_TELEGRAM_USERNAME_OF_BILIARCHIVER_BOT}\
  -e BILIARCHIVER_API={THE_API_URL_OF_BILIARCHIVER}\
  -e BILIARCHIVER_BOT={YOUR_BOT_TOKEN}\
  -e BILIARCHIVER_ENABLE_BLACKLIST=true\ # Optional, if you want to enable blacklist feature, don't forget to trigger /addadmin command first
  --restart always \
  ghcr.io/saveweb/biliarchiverbot:latest
```

If you have public IP, you can set the bot's webhook to your IP address.

``` shell
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_IP_ADDRESS>:5173/bot/webhook
```

If you don't have public IP, you can use [ngrok](https://ngrok.com/) to expose your local server to the internet, or use any other tunneling service. Caddy and Nginx are also good choices.

``` shell
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<TUNNELING_URL>/bot/webhook
```


## Deploy to Vercel

> May have some issues with complicated bot commands, sometimes might not work as expected.

1. fork this repository
2. open vercel.com and create a new project
3. connect the project to your forked repository
4. set the environment variables.

   If you don't have a bot yet, you can create one by talking to [@BotFather](https://t.me/BotFather) on Telegram.

   If you don't know the deployed URL, you can deploy the project first and then set the environment variables later.

   ``` env
    BILIARCHIVER_WEBAPP=<THE_DEPLOYED_WEBAPP_URL>
    BILIARCHIVER_USERNAME=<THE_TELEGRAM_USERNAME_OF_BILIARCHIVER_BOT>
    BILIARCHIVER_API=<THE_API_URL_OF_BILIARCHIVER>
    BILIARCHIVER_BOT=<YOUR_BOT_TOKEN>
   ```

5. deploy
6. set the bot's webhook to the deployed URL. You can copy the link below and replace your bot's token and the deployed URL.

   ``` shell
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<DEPLOY_URL>/bot/webhook
   ```

## Local Development

1. clone this repository
2. install the dependencies

   ``` shell
   pnpm install
   ```
3. create a `.env` file and set the environment variables.

   ``` env
    BILIARCHIVER_WEBAPP=<THE_DEPLOYED_WEBAPP_URL>
    BILIARCHIVER_USERNAME=<THE_TELEGRAM_USERNAME_OF_BILIARCHIVER_BOT>
    BILIARCHIVER_API=<THE_API_URL_OF_BILIARCHIVER>
    BILIARCHIVER_BOT=<YOUR_BOT_TOKEN>
   ```
4. start the development server

   ``` shell
    pnpm dev
    ```
5. set the bot's webhook to the deployed URL. 

   You may use [ngrok](https://ngrok.com/) to expose your local server to the internet, or open the port 5173 on your router or the VPS. Then you can copy the link below and replace your bot's token and the deployed URL.

   ``` shell
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<DEPLOY_URL>/bot/webhook
   ```

## Manage

Please checkout `/admin` command for more information. 

### Admin Management
The first user to run `/addadmin` becomes the admin. After that, only admins can add new admins using:
```shell
/addadmin <USER_ID>
```

### User Management
Admins can blacklist users using:
```shell
/blacklist <USER_ID>
```
Blacklisted users will be unable to use the bot and will be directed to contact the first admin.
