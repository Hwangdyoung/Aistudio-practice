import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export interface SocialContent {
  linkedin: string;
  twitter: string;
  instagram: string;
}

export interface GeneratedImage {
  url: string;
  platform: string;
}

export async function generateSocialPosts(idea: string, tone: string): Promise<SocialContent> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const prompt = `Generate social media posts for the following idea: "${idea}". 
  The tone should be ${tone}.
  Provide content for:
  1. LinkedIn: A professional, long-form post with insights.
  2. Twitter/X: A short, punchy post with relevant hashtags.
  3. Instagram: A visual-focused caption with a list of hashtags.
  
  Return the result as a JSON object with keys: "linkedin", "twitter", "instagram".`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          linkedin: { type: Type.STRING },
          twitter: { type: Type.STRING },
          instagram: { type: Type.STRING },
        },
        required: ["linkedin", "twitter", "instagram"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as SocialContent;
}

export async function generatePlatformImage(
  idea: string, 
  platform: string, 
  aspectRatio: string,
  imageSize: string = "1K"
): Promise<string> {
  // We create a new instance to ensure we use the latest API key from the dialog
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const platformPrompts: Record<string, string> = {
    linkedin: `A professional, high-quality editorial image for LinkedIn representing: ${idea}. Clean, corporate, and inspiring.`,
    twitter: `A bold, eye-catching, and modern graphic for Twitter/X representing: ${idea}. High contrast and punchy.`,
    instagram: `An aesthetically pleasing, lifestyle-focused, and vibrant image for Instagram representing: ${idea}. High quality and trendy.`,
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: {
      parts: [{ text: platformPrompts[platform] || idea }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: imageSize as any,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
}
