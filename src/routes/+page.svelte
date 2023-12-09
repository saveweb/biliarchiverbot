<script lang="ts">
  import type { Config } from "@sveltejs/kit";
  import type { PageData } from "./$types";
  import Bvid from "$lib/bv";
  import { onMount } from "svelte";
  export let data: PageData;
  export const config: Config = {
    runtime: "edge",
  };

  function timestamp2time(i: number) {
    return new Date(i * 1000).toLocaleDateString();
  }

  $: items =
    data?.archived?.items.map((x) => {
      return { cover: "", ...x } satisfies {
        cover: string;
      } & typeof x;
    }) || [];

  onMount(async () => {
    // async function getCover(bvid: string): Promise<string> {
    //   try {
    //     let endpoint = "/api?" + new URLSearchParams({ bvid });
    //     const res = await fetch(endpoint, {
    //       method: "GET",
    //     });
    //     const data = await res.json();
    //     console.log(data);
    //     return data?.url;
    //   } catch (e) {
    //     console.error(e);
    //     return "";
    //   }
    // }
    items.forEach((item) => {
      // getCover(item.bvid).then((src) => {
      //   item.cover = src;
      // });
      const bv = new Bvid(item.bvid);
      item.cover = `https://archive.org/services/img/BiliBili-${bv.toIdentifier()}/full/pct:400/0/default.jpg`;
    });
  });
</script>

<main>
  <h1>Biliarchiver Bot Status</h1>
  <p>Running: {data?.archived?.success || "down"}</p>
  <h2>Archived recently</h2>
  <ul>
    {#each items as item}
      <li>
        <div>
          <a class="bvid" href="https://www.bilibili.com/video/{item.bvid}"
            >{item.bvid}</a
          >
          <time class="hint">{timestamp2time(item.added_time)}</time>
          <storng>{item.status}</storng>
          <span>{item.status === "finished" ? "✅" : "❌"}</span>
        </div>
        <div>
          <img src={item.cover} alt="cover" />
        </div>
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
  li {
    display: flex;
  }
</style>
