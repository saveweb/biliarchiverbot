import { None, Option, Some } from "ts-results-es";
import Bvid from "./bv.js";
import { XMLParser } from "fast-xml-parser";
export class BiliArchiver {
  endpoint: URL;

  constructor(endpoint: URL) {
    this.endpoint = endpoint;
  }

  async add(bv: Bvid): Promise<boolean> {
    // POST /archive/BVxxxxxx
    const url = new URL(`/archive/${bv}`, this.endpoint);
    console.info(`POST ${url.toString()}`);
    try {
      const res = await fetch(url.toString(), {
        method: "POST",
      });
      const data = await res.json();
      console.info(data);
      return data?.success === true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async queue(): Promise<string[]> {
    // http://hz1.server.saveweb.org:41835/archive
    const url = new URL(`/archive`, this.endpoint);
    try {
      const res = await fetch(url.toString());
      const items = (await res.json())?.items;
      // filter those not finished
      return items.filter((item: any) => item.status !== "finished").map((item: any) => item.bvid);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async check(bv: Bvid): Promise<Option<URL>> {
    try {
      const url = bv.getMetadataUrl()
      const res = await fetch(url.toString(), {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      const json = await res.json();
      const mp4 = json?.files?.find((file: any) => file.name.endsWith(".mp4"))
      if (!mp4) {
        return None
      }
      return Some(bv.getItemUrl())
    } catch (e) {
      console.warn(e);
      return None
    }
  }

  async search(bv: Bvid): Promise<Option<URL>> {
    try {
      const res = await fetch(bv.getSearchXmlUrl().toString());
      const text = await res.text();
      // const parser = new DOMParser();
      // const doc = parser.parseFromString(text, "text/xml");
      // const numFound = doc.getElementsByTagName("result")[0].getAttribute("numFound");
      const parser = new XMLParser({
        ignoreAttributes: false
      })
      const obj = parser.parse(text)
      const numFound = obj?.response?.result?.["@_numFound"]
      console.log({ numFound }); // 打印 numFound 的值
      if (!numFound) {
        return None
      }
      return Some(bv.getItemUrl())
    }
    catch (e) {
      console.error(e);
      return None
    }
  }
}
