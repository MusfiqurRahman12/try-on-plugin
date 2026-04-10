import { client } from "@gradio/client";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { userImageBase64, garmentUrl, garmentId } = req.body;

    if (!userImageBase64) {
      return res.status(400).json({ message: 'User image is required' });
    }

    console.log("Starting Hugging Face IDM-VTON prediction... (This may take 30-60s)");

    // Convert Base64 data URI to Web Blob securely using native fetch
    const userBlob = await (await fetch(userImageBase64)).blob();
    
    let garmBlob;
    if (garmentUrl && garmentUrl.startsWith('data:')) {
       garmBlob = await (await fetch(garmentUrl)).blob();
    } else if (garmentUrl) {
       garmBlob = await (await fetch(garmentUrl)).blob();
    } else {
       return res.status(400).json({ message: 'Garment image/URL is required' });
    }

    const app = await client("yisol/IDM-VTON");
    
    // Call the specific /tryon endpoint with 7 arguments
    const result = await app.predict("/tryon", [
      { background: userBlob, layers: [], composite: null }, // User image (dict for auto-masking)
      garmBlob, // Garment image
      "virtual try on garment", // Description
      true, // Auto-masking enabled
      true, // Auto-crop enabled
      30, // Denoise Steps
      42 // Random Seed
    ]);

    // The result from Gradio contains the output images
    // result.data[0] is the main generated image object { url: string }
    const generatedImageUrl = result.data[0].url;

    // Fetch the image down from the Hugging Face server so we can proxy it securely as Base64
    // This solves cross-origin "File not found" issues when trying to download on the client side.
    const imageResponse = await fetch(generatedImageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const finalBase64Url = `data:image/jpeg;base64,${base64String}`;

    console.log("Successfully generated Try-On image via HF Space and converted to Base64!");

    return res.status(200).json({
      success: true,
      message: "AI Try-On Image generated successfully by IDM-VTON.",
      imageUrl: finalBase64Url, 
    });

  } catch (error) {
    console.error("Error in try-on generation:", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message || error });
  }
}
