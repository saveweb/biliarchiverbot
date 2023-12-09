<script lang="ts">
  import type { Config } from "@sveltejs/kit";
  import type { PageData } from "./$types";
  export let data: PageData;
  export const config: Config = {
    runtime: "edge",
  };

  function timestamp2time(i: number) {
    return new Date(i * 1000).toLocaleDateString();
  }
</script>

<main>
  <h1>Biliarchiver Bot Status</h1>
  <p>Running: {data?.archived?.success || "down"}</p>
  <h2>Archived recently</h2>
  <ul>
    {#each data?.archived?.items || [] as { added_time, bvid, status }}
      <li>
        <a class="bvid" href="https://www.bilibili.com/video/{bvid}">{bvid}</a>
        <time class="hint">{timestamp2time(added_time)}</time>
        <storng>{status}</storng>
        <span>{status === "finished" ? "✅" : "❌"}</span>
      </li>
    {/each}
  </ul>
</main>

<style>
  main {
    color: var(--tg-theme-text-color);
    font-family: "Noto Sans CJK SC", "Noto Sans", "HarmonyOS Sans", "Mi Sans",
      "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
      "WenQuanYi Micro Hei", sans-serif;
  }
  .bvid,
  time {
    font-family: monospace;
  }
  ul {
    list-style: none;
    padding: 0;
  }
</style>
