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
    const urlRegex = /https?:\/\/b23\.(tv|wtf)\/\S+/g;
    let match: RegExpExecArray | null;
    let updatedString = str;

    while ((match = urlRegex.exec(str)) !== null) {
        const originalUrl = match[0];
        const redirectedUrl = await fetchRedirectUrl(originalUrl);
        if (redirectedUrl)
            updatedString = updatedString.replace(originalUrl, redirectedUrl.toString());
    }

    return updatedString;
};

export default resolveB23;

