// This file is running on the server side, so no one will be able to see it and the sensitive information that I defined in the headers will not be visible to the users
"use server";

export async function generateImage(inputText: string) {
  try {
    const response = await fetch("http://localhost:3000/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MODAL_TOKEN}`,
      },
      body: JSON.stringify({ inputText }),
    });

    if (!response.ok) {
      // Log full response if needed for debugging
      const errorData = await response.json();
      console.error("API response:", errorData);
      throw new Error(
        `HTTP Error! Status: ${response.status}, message: ${errorData}`
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
