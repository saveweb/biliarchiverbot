export class BiliArchiver {
  endpoint: URL;

  constructor(endpoint: URL) {
    this.endpoint = endpoint;
  }

  async archive(bv: string): Promise<boolean> {
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
}
