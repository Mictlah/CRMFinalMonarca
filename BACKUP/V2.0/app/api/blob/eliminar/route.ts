import { del } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const { pathname } = await req.json()

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
        return NextResponse.json({ error: "Token no disponible" }, { status: 500 })
    }

    try {
        await del(pathname, { token })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error eliminando archivo del blob:", error)
        return NextResponse.json({ error: "Error eliminando archivo" }, { status: 500 })
    }
}
