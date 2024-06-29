export default class Bvid {
    id: string;
    constructor(source: string) {
      if (!source.startsWith("BV")) {
        throw new Error("invalid bvid");
      }
      this.id = source;
    }

    toString() {
      return this.id;
    }

    toIdentifier(part: number = 1) {
      return `BiliBili-${this.id
        }_p${part}-${this.getHumanReadableUpperPartMap()}`;
    }

    toMarkdownArchiveLink(part: number = 1) {
      return `[${this.toIdentifier(part)}](${this.getItemUrl(part)})`;
    }

    toMarkdownBilibiliLink() {
      return `[${this.id}](https://www.bilibili.com/video/${this.id})`;
    }

    getSearchXmlUrl(part: number = 1) {
      return new URL(
        `https://archive.org/advancedsearch.php?q=identifier%3A${this.toIdentifier()}&fl%5B%5D=identifier&sort%5B%5D=addeddate+desc&sort%5B%5D=&sort%5B%5D=&rows=50&page=1&callback=callback&output=xml`
      );
    }

    getItemUrl(part: number = 1) {
      return new URL(`https://archive.org/details/${this.toIdentifier(part)}`);
    }

    getMetadataUrl(part: number = 1) {
      return new URL(
        `https://archive.org/metadata/${this.toIdentifier(part)}`
      );
    }

    private getHumanReadableUpperPartMap(
      backward = true // to avoid confusion, backward must be true
    ): string {
      if (!backward) {
        throw new Error("backward must be true");
      }
      let id = this.id;
      if (backward) {
        id = id.split("").reverse().join("");
      }

      let result = "";
      let steps = 0;
      for (const char of id) {
        if (/[A-Z]/.test(char)) {
          if (steps === 0) {
            result += char;
          } else {
            result += `${steps}${char}`;
          }
          steps = 0;
        } else {
          steps += 1;
        }
      }

      return result;
    }
  }