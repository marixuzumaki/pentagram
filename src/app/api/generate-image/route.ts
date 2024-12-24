import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import env from "../../../../env";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body; // First we need to get the actual prompt the user types in the input body

    const apiSecret = request.headers.get("API_KEY");
    if (apiSecret !== env.API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(text);

    const url = new URL("https://j00961010--sd-demo-model-generate.modal.run");
    url.searchParams.set("prompt", text);
    console.log("Request URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        API_KEY: `Bearer ${env.API_KEY}`,
        Accept: "image/jpeg",
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
    // The way I did it creates a long string of random numbers/characters

    const blob = await put(filename, imageBuffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    return NextResponse.json({
      success: true,
      imageUrl: blob.url, // Displaying it on the frontend, gives you a public server url where you can display the image
    });
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return new Response("Invalid JSON", { status: 400 });
  }
}
