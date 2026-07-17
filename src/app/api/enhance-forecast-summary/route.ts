import { NextResponse } from "next/server";

interface EnhanceRequest {
  text?: string;
}

interface EnhanceApiResponse {
  success?: boolean;
  data?: {
    enhanced_text?: string;
  };
  error?: string;
  detail?: string;
  message?: string;
}

const DEFAULT_ENHANCE_URL = "https://dgmcar.1dataconnect.com/dgm_bot/api/v1/enhance";

export async function POST(request: Request) {
  let body: EnhanceRequest;

  try {
    body = (await request.json()) as EnhanceRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  const apiKey = process.env.DGM_BOT_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Enhance API key is not configured." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(process.env.DGM_BOT_ENHANCE_URL ?? DEFAULT_ENHANCE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ text }),
    });

    const raw = await response.text();
    let payload: EnhanceApiResponse | null = null;
    try {
      payload = raw ? (JSON.parse(raw) as EnhanceApiResponse) : null;
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const upstreamMsg =
        payload?.error ||
        payload?.detail ||
        payload?.message ||
        (response.status === 502 || response.status === 503
          ? "Enhance service is temporarily unavailable (upstream 502)."
          : `Enhance service returned ${response.status}.`);

      return NextResponse.json({ error: upstreamMsg }, { status: 502 });
    }

    if (!payload?.success || !payload.data?.enhanced_text) {
      return NextResponse.json(
        {
          error:
            payload?.error ||
            payload?.detail ||
            payload?.message ||
            "Enhance service returned an empty result.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ enhancedText: payload.data.enhanced_text });
  } catch (error) {
    console.error("Enhance forecast summary error:", error);
    return NextResponse.json(
      { error: "Unable to reach enhance service. Please try again." },
      { status: 502 }
    );
  }
}
