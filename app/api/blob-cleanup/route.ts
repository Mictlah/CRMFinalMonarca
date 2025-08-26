import { NextResponse } from "next/server";
import { list, del } from "@vercel/blob";

export const dynamic = "force-dynamic";

type CleanupBody = {
  prefixes?: string[]; // e.g., ["operadores/", "embarques/"]
  dryRun?: boolean;
  limit?: number; // optional safety limit of files to delete
  startIso?: string; // inclusive
  endIso?: string;   // exclusive
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CleanupBody;
  const prefixes = (body?.prefixes && Array.isArray(body.prefixes) && body.prefixes.length > 0)
      ? body.prefixes
      : ["operadores/", "embarques/"];
    const dryRun = Boolean(body?.dryRun);
    const limit = typeof body?.limit === 'number' && body.limit > 0 ? Math.floor(body.limit) : undefined;
  const startTs = body?.startIso ? Date.parse(body.startIso) : undefined;
  const endTs = body?.endIso ? Date.parse(body.endIso) : undefined;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        error: "Falta BLOB_READ_WRITE_TOKEN en el servidor.",
      }, { status: 500 });
    }

    let scanned = 0;
    let deleted = 0;
    const details: Array<{ prefix: string; scanned: number; deleted: number; }> = [];

    // helper to extract approximate upload time
    const getBlobTime = (b: any): number | undefined => {
      if (b?.uploadedAt) {
        const t = b.uploadedAt instanceof Date ? b.uploadedAt.getTime() : Date.parse(b.uploadedAt);
        if (!Number.isNaN(t)) return t;
      }
      const path = b?.pathname || b?.url || '';
      const name = String(path).split('/').pop() || '';
      const m = name.match(/(\d{10,13})/);
      if (m) {
        const num = Number(m[1]);
        if (m[1].length >= 13) return num; // ms
        return num * 1000; // seconds
      }
      return undefined;
    };

    for (const prefix of prefixes) {
  let cursor: string | undefined = undefined;
      let scannedThis = 0;
      let deletedThis = 0;
      do {
  const { blobs, cursor: nextCursor }: { blobs: Array<{ url: string; pathname?: string; uploadedAt?: Date | string }>; cursor?: string } = await list({
          prefix,
          token: process.env.BLOB_READ_WRITE_TOKEN,
          cursor,
        });
        for (const b of blobs) {
          scanned++; scannedThis++;
          // filter by optional date range
          if (startTs !== undefined || endTs !== undefined) {
            const bt = getBlobTime(b);
            if (bt === undefined) {
              // if we can't determine time, skip when filtering is requested
              continue;
            }
            if (startTs !== undefined && bt < startTs) continue;
            if (endTs !== undefined && bt >= endTs) continue;
          }
          if (!dryRun) {
            await del(b.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
            deleted++; deletedThis++;
          }
          if (limit && deleted >= limit) break;
        }
  cursor = nextCursor;
        if (limit && deleted >= limit) break;
      } while (cursor);
      details.push({ prefix, scanned: scannedThis, deleted: dryRun ? 0 : deletedThis });
      if (limit && deleted >= limit) break;
    }

    return NextResponse.json({
      ok: true,
      dryRun,
      scanned,
      deleted,
      details,
    });
  } catch (error: any) {
    console.error("Blob cleanup error:", error);
    return NextResponse.json({ error: error?.message || "Error desconocido" }, { status: 500 });
  }
}
