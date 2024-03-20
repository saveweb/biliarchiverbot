import { Result, Ok, Err } from "ts-results-es";
import { env } from '$env/dynamic/private';

interface BasicStatus {
    status: string;
    biliarchiver: {
        version: string;
    };
    api: {
        version: number;
    };
    timestamp: number;
}

interface ArchivedItem {
    added_time: number;
    bvid: string;
    status: string;
}

interface ArchiveResponse {
    success: boolean;
    total_tasks_queued: number;
    items: ArchivedItem[];
}

const BASE = env.BILIARCHIVER_API || "http://127.0.0.1:21232/";
async function getStatus(): Promise<Result<BasicStatus, unknown>> {
    try {
        const response = await fetch(BASE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BasicStatus = await response.json();
        return Ok(data);
    } catch (error) {
        return Err(error);
    }
}

async function getArchived(): Promise<Result<ArchiveResponse, unknown>> {
    try {
        const response = await fetch(`${BASE}archive`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ArchiveResponse = await response.json();
        data.items.sort((a, b) => b.added_time - a.added_time);
        return Ok(data);
    } catch (error) {
        return Err(error);
    }
}



export const load = async (params: unknown) => {
    return {
        status: (await getStatus()).unwrapOr(null),
        archived: (await getArchived()).unwrapOr(null),
    };
}
