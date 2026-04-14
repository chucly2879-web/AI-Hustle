import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSideHustleIdea(interests: string) {
  const prompt = `
    Bạn là một chuyên gia về kinh tế số và AI. 
    Người dùng có sở thích/kỹ năng sau: "${interests}".
    Hãy gợi ý 3 ý tưởng cụ thể để kiếm tiền từ internet bằng cách sử dụng AI dựa trên sở thích này.
    Mỗi ý tưởng bao gồm:
    1. Tên ý tưởng (Ngắn gọn, hấp dẫn)
    2. Cách thực hiện (3-4 bước)
    3. Công cụ AI gợi ý (Ví dụ: ChatGPT, Midjourney, v.v.)
    4. Tiềm năng thu nhập (Thấp/Trung bình/Cao)

    Hãy trả về kết quả bằng tiếng Việt, định dạng rõ ràng, chuyên nghiệp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Không có kết quả trả về.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Rất tiếc, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.";
  }
}

export async function runCustomPrompt(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Không có kết quả trả về.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Rất tiếc, đã có lỗi xảy ra khi kết nối với AI. Vui lòng thử lại sau.";
  }
}
