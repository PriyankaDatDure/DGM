import { NextResponse } from "next/server";
import { loadBulletinById } from "@/lib/db/bulletin-load";
import { bulletinPdfFilename, generateBulletinPdf } from "@/lib/bulletin/bulletin-pdf";

type RouteContext = {
  params: Promise<{ bulletinId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { bulletinId } = await context.params;
  const id = bulletinId?.trim();

  if (!id) {
    return NextResponse.json({ error: "Bulletin ID is required." }, { status: 400 });
  }

  try {
    const bulletin = await loadBulletinById(id);
    if (!bulletin) {
      return NextResponse.json({ error: "Weather bulletin not found." }, { status: 404 });
    }

    const pdf = await generateBulletinPdf(bulletin, id);
    const filename = bulletinPdfFilename(id, bulletin.metadata.forecaster_name);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Bulletin PDF generation failed:", error);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 500 });
  }
}
