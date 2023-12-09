import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Bvid from "$lib/bv";
import { LRUCache } from 'lru-cache'

const cache: LRUCache<string, string> = new LRUCache({
    max: 150,
});

export const GET: RequestHandler = async ({ url }) => {
    const bvid = url.searchParams.get('bvid');
    if (!bvid) {
        throw error(400, "Missing bvid");
    }

    try {
        if (cache.has(bvid)) {
            return new Response(cache.get(bvid))
        }
        const bv = new Bvid(bvid);
        const url = bv.getMetadataUrl()
        const res = await fetch(url.toString(), {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
        const json = await res.json();
        const jpg = json?.files?.find((file: any) => file.name.endsWith(".jpg"))
        if (!jpg) {
            throw error(404, "No jpg found")
        }
        console.info(jpg)
        // https://archive.org/services/img/BiliBili-BV1ca4y1f7zu_p1-10VB/full/pct:400/0/default.jpg
        const jpgUrl = `https://archive.org/services/img/BiliBili-${bv.toIdentifier()}/full/pct:400/0/default.jpg`
        cache.set(bvid, jpg)
        return new Response(jpg)
    } catch (e) {
        console.warn(e);
        throw error(500, "Internal Server Error")
    }
};
