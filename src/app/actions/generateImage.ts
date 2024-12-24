// This file is running on the server side, so no one will be able to see it and the sensitive information that I defined in the headers will not be visible to the users
"use server";

export async function generateImage(text: string) {
  try {
    if (!process.env.MODAL_API_KEY) {
      throw new Error("API_KEY is not set in environment variables.");
    }

    const apiUrl = "http://localhost:3000/api/generate-image";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.MODAL_API_KEY || "",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      // Log full response if needed for debugging
      const errorData = await response.json();
      console.error("API response:", errorData);
      throw new Error(
        `HTTP Error! Status: ${response.status}, message: ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Server Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}
