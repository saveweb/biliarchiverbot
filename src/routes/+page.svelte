<script lang="ts">
  import type { Config } from "@sveltejs/kit";
  import type { PageData } from "./$types";
  export let data: PageData;
  export const config: Config = {
    runtime: "edge",
  };
</script>

<h1>Biliarchiver Bot Status</h1>
<p>Running: {data?.archived?.success || "down"}</p>
<h2>Archived recently</h2>
<ul>
  {#each data?.archived?.items || [] as { added_time, bvid, status }}
    <li>
      <a class="bvid" href="https://www.bilibili.com/video/{bvid}">{bvid}</a>
      <time>{added_time}</time>
      <mark>{status}</mark>
    </li>
  {/each}
</ul>

<style>
  * {
    font-family: "Noto Sans CJK SC", "Noto Sans", "HarmonyOS Sans", "Mi Sans",
      "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
      "WenQuanYi Micro Hei", sans-serif;
  }
  .bvid,
  time {
    font-family: monospace;
  }
</style>
