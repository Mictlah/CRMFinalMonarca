import { NextResponse } from "next/server";

// Fuerza runtime dinámico para leer env en cada request
export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return NextResponse.json({
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 8) + "..." : null,
    length: token?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    message: !token
  ? `BLOB_READ_WRITE_TOKEN no está disponible en el runtime. Verifica:
1) Nombre exacto
2) .env.local junto a package.json
3) Reinicia el servidor tras cambios
4) Ejecuta 'next dev' dentro de la carpeta del proyecto.`
  : "Token detectado correctamente.",
  });
}
