import { av2bv } from './av2bv.js';

const fetchRedirectUrl = async (url: URL | string): Promise<URL | null> => {
    try {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.info("Fetched URL: ", url, "\nRedirected to: ", response.url);
        const target = new URL(response.url);
        target.search = "";
        return target;
    } catch (error) {
        console.error('Error fetching URL:', error);
        return null;
    }
};

const resolveB23 = async (str: string): Promise<string> => {
    const urlRegex = /b23\.(tv|wtf)\/\S+/g;
    let match: RegExpExecArray | null;
    let updatedString = str;
    console.info("Resolving B23 links in: ", str);

    const avRegex = /av(\d+)/g;
    if ((match = avRegex.exec(str)) !== null) {
        let av = match[1];
        const bv = av2bv(match[1]); 
        console.info("av" + av + " -> " + bv);
        updatedString = updatedString.replace("av" + av, bv);
        console.info("Replaced av" + av + " with " + bv);
    }

    while ((match = urlRegex.exec(str)) !== null) {
        const originalUrl = "https://" + match[0];
        const redirectedUrl = await fetchRedirectUrl(originalUrl);
        if (redirectedUrl)
            updatedString = redirectedUrl.toString();
    }

    return updatedString;
};

export default resolveB23;

