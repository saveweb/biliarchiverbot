<script lang="ts">
  import type { Config } from "@sveltejs/kit";
  import type { PageData } from "./$types";
  import Bvid from "$lib/bv";
  import { List } from "svelte-virtual";
  export let data: PageData;
  export const config: Config = {
    runtime: "edge",
  };

  function timestamp2time(i: number) {
    return new Date(i * 1000).toLocaleDateString();
  }

  $: items =
    data?.archived?.items.map((x) => {
      const bv = new Bvid(x.bvid);
      return {
        cover: `https://archive.org/services/img/${bv.toIdentifier()}/full/pct:320/0/default.jpg`,
        link: bv.getItemUrl().toString(),
        ...x,
      } satisfies {
        cover: string;
        link: string;
      } & typeof x;
    }) || [];
</script>

<main>
  <h2>Biliarchiver Bot Status</h2>
  <p id="general">Running: {data?.archived?.success || "down"}</p>
  <h2>Archived recently</h2>
  <ul>
    <List height={650} width="100vw" itemCount={items.length} itemSize={320}>
      <li slot="item" let:index let:style {style}>
        <div class="info">
          <h3>
            <a
              class="bvid"
              href="https://www.bilibili.com/video/{items[index].bvid}"
              >{items[index].bvid}</a
            >
          </h3>
          <time class="hint">{timestamp2time(items[index].added_time)}</time>
          <storng>{items[index].status}</storng>
          <span>{items[index].status === "finished" ? "✅" : "❌"}</span>
        </div>
        <div class="cover">
          <a href={items[index].link}>
            <img src={items[index].cover} alt="cover" loading="lazy" />
            <img
              class="hover-icon"
              src="ia-logo.svg"
              alt="Play on Internet Archive"
              width="70px"
            />
          </a>
        </div>
      </li>
    </List>
  </ul>
</main>

<style>
  main {
    margin: 2em 0;
    border-radius: 4px;
    /* background-color: var(--tg-theme-bg-color); */
    color: var(--tg-theme-text-color);
    font-family: "Noto Sans CJK SC", "Noto Sans", "HarmonyOS Sans", "Mi Sans",
      "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
      "WenQuanYi Micro Hei", sans-serif;
  }
  .bvid,
  time {
    font-family: "IBM Plex Mono", "Noto Sans Mono", Consolas, monospace;
  }
  #general {
    font-size: 20px;
    margin: 12px 20px;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    margin: 1em 8px;
    border-radius: 8px;
    height: 320px;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding-top: 6px;
    padding-bottom: 32px;
  }
  li:nth-child(odd) {
    background-color: var(--tg-theme-secondary-bg-color);
  }
  h3 {
    margin: 4px;
  }
  .info {
    font-size: 20px;
    margin: 12px 0;
    width: calc(100vw - 40px);
  }
  img[alt="cover"] {
    width: 320px;
    display: block;
    margin: auto;
    transition:
      filter 0.2s ease-out,
      transform 0.2s ease-out;
    border-radius: 6px;
  }
  img[alt="cover"]:hover {
    filter: brightness(1.3) blur(3px) grayscale(0) hue-rotate(10deg);
    transform: scale(1.04);
  }
  img[alt="cover"]:active {
    filter: brightness(0.9) blur(0) grayscale(0.5) hue-rotate(-10deg);
    transform: scale(0.96);
  }
  .cover a {
    position: relative;
    user-select: none;
  }
  .hover-icon {
    user-select: none;
    pointer-events: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    margin: 0;
    opacity: 0;
    transition: opacity 0.2s ease-out;
    margin: auto;
  }
  .cover img:hover + .hover-icon {
    opacity: 0.8;
  }

  a.bvid {
    padding: 4px;
    font-size: 90%;
    border-radius: 4px;
    color: var(--tg-theme-button-text-color);
    background-color: var(--tg-theme-button-color);
    text-decoration: none;
    margin: 4px;
    filter: brightness(1);
    transition: filter 0.2s ease-out;
  }
  a.bvid:hover {
    filter: brightness(1.1);
  }
  a.bvid:active {
    filter: brightness(0.9);
  }

  * {
    overflow: hidden!important;
  }
</style>
