import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Helper to clean text (removes markdown, addresses, hashes)
function prepareTextForSpeech(rawText: string): string {
  const addressPattern = /0x[a-fA-F0-9.]{8,}/g;
  const digestPattern = /\b[A-Za-z0-9]{30,}\b/g;
  const markdownPattern = /```[\s\S]*?```/g;

  return rawText
    .replace(markdownPattern, "code block") 
    .replace(addressPattern, "this wallet address") 
    .replace(digestPattern, "transaction hash")
    .replace(/\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const cleanText = prepareTextForSpeech(text);
    
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });

    // FIX 1: Use snake_case parameters (model_id, output_format)
    // FIX 2: Cast the result to AsyncIterable to solve the TS 2495 error
    const audioStream = await client.textToSpeech.stream("21m00Tcm4TlvDq8ikWAM", {
      text: cleanText,
      modelId: "eleven_turbo_v2", 
      outputFormat: "mp3_44100_128", 
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        useSpeakerBoost: true,
        speed: 1.1,
      },
    }) as unknown as AsyncIterable<Uint8Array>;

    // Convert the Node stream to a Web ReadableStream for Next.js response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of audioStream) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Vercel-Cache-Control": "no-cache",
      },
    });

  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json({ error: "Failed to generate audio" }, { status: 500 });
  }
}