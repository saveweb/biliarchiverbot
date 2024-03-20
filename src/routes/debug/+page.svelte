<script lang="ts">
  import type { Config } from "@sveltejs/kit";
  export const config: Config = {
    runtime: "edge",
  };

  let textareaValue = "None";
  function setTelegramMiniappParams() {
    // Once the script is connected, a window.Telegram.WebApp object will become available with the following fields:
    // @ts-ignore
    const json = JSON.stringify(window.Telegram.WebApp);
    textareaValue = json;
  }
</script>

<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>
<main>
  <nav>
    <h2>Biliarchiver Bot Debug Page</h2>
  </nav>
  <textarea readonly>{textareaValue}</textarea>
  <button on:click={setTelegramMiniappParams}>Get data</button>
</main>

<style>
  main {
    margin: 0;
    border-radius: 4px;
    /* background-color: var(--tg-theme-bg-color); */
    color: var(--tg-theme-text-color, #f5f5f5);
    font-family: "Noto Sans CJK SC", "Noto Sans", "HarmonyOS Sans", "Mi Sans",
      "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
      "WenQuanYi Micro Hei", sans-serif;
  }
</style>
