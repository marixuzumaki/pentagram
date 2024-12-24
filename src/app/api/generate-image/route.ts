import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import env from "../../../../env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body; // First we need to get the actual prompt the user types in the input body

    const apiSecret = request.headers.get("X-API-KEY");

    if (apiSecret !== env.MODAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(text);

    const url = new URL("https://j00961010--sd-demo-model-generate.modal.run/");
    url.searchParams.set("prompt", text);
    console.log("Request URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-KEY": env.MODAL_API_KEY || "",
        Accept: "image/jpeg", // Image Format
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Response:", errorText);
      throw new Error(
        `HTTP Error! Status: ${response.status}, message: ${errorText}`
      );
    }
    const imageBuffer = await response.arrayBuffer();

    const filename = `${crypto.randomUUID()}.jpg`; // Use crypto to sanitize the names of the files that the image are saved as

    const blob = await put(filename, imageBuffer, {
      access: "public",
      contentType: "image/jpeg", // Image Format
    });

    return NextResponse.json({
      success: true,
      imageUrl: blob.url, // Gives you a public server url where you can display the image
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        message: error?.toString(),
      },
      { status: 500 }
    );
  }
}
