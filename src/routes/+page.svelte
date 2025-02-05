<script lang="ts">
  import type { Config } from "@sveltejs/kit";
  import { List } from "svelte-virtual";
  import type { PageData } from "./$types.js";
  import Bvid from "$lib/bv.js";
  export let data: PageData;
  export const config: Config = {
    runtime: "edge",
  };

  let scrollPosition = 0;

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

<svelte:head>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</svelte:head>
<main>
  <nav class={scrollPosition == 0 ? "" : "stuck"}>
    <h2>
      Biliarchiver Bot (<a href="/debug"
        >{data?.archived?.success ? "Running" : "Down"}</a
      >)
    </h2>
  </nav>
  <ul>
    <List
      height="calc(100vh - 90px)"
      width="100vw"
      itemCount={items.length}
      itemSize={320}
      bind:scrollPosition
    >
      <li
        slot="item"
        let:index
        let:style
        style={style.replace("width: 100%;", "width: 90%;")}
      >
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
          {#if items[index].status === 'finished'}
            <a href={items[index].link}>
              <img src={items[index].cover} alt="cover" loading="lazy" />
              <img
                class="hover-icon"
                src="ia-logo.svg"
                alt="Play on Internet Archive"
                width="70px"
              />
            </a>
          {:else}
            <iframe
              src="//player.bilibili.com/player.html?bvid={items[index].bvid}&autoplay=0"
              scrolling="no"
              border="0"
              frameborder="no"
              framespacing="0"
              allowfullscreen="true"
              width="320"
              height="180"
              title="Bilibili Player"
            ></iframe>
          {/if}
        </div>
      </li>
    </List>
  </ul>
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
  .bvid,
  time {
    font-family: "IBM Plex Mono", "Noto Sans Mono", Consolas, monospace;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0 auto;
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
    transition: background-color 0.1s ease-out;
  }
  li:hover {
    /* li:nth-child(odd) */
    background-color: var(--tg-theme-secondary-bg-color, #313b43);
    /* var(--tg-theme-section-bg-color, #282e33)!important; */
  }
  nav {
    position: sticky;
    height: 70px;
    transition: box-shadow 0.2s ease-out;
  }
  nav.stuck {
    box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.4);
  }
  h3 {
    margin: 4px;
  }
  .info {
    font-size: 20px;
    margin: 12px 0;
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
  .cover {
    width: 320px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .cover a {
    position: relative;
    user-select: none;
  }
  a {
    text-decoration: none;
    color: var(--tg-theme-text-color, #f5f5f5);
    cursor: initial;
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
    color: var(--tg-theme-button-text-color, #fff);
    background-color: var(--tg-theme-button-color, #d27570);
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
    overflow: hidden !important;
  }

  iframe {
    border-radius: 6px;
  }
</style>
