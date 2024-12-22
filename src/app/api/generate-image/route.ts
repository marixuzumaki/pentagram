import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body; // First we need to get the actual prompt the user types in the input body

    // We have an API endpoint, so we can just hit it from here in the backend
    // Never call an API endpoint from the internal side
    const apiSecret = request.headers.get("API_KEY");

    if (apiSecret !== process.env.API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(prompt);

    const url = new URL(""); // Enter my personal endpoint url

    url.searchParams.set("prompt", prompt);

    console.log("Request URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "API_KEY": process.env.API_KEY || "", // Here is where we are defining our x-api...
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
    // If we get this far, our API request was successful
    // Now we need somewhere to store our images, I used vercel
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
    console.error("Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
