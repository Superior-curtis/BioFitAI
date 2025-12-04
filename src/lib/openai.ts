// ⚠️ WARNING: Storing API keys in frontend code is NOT secure!
// This is only for development/testing. For production, use a backend service.

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = import.meta.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1";

export async function getAIRecommendation(
  meals: any[],
  exercises: any[],
  userProfile: any
): Promise<string> {
  const userMessage = `你是一位專業的營養學和運動生理學專家，擁有生物化學和代謝學知識。
請根據用戶的飲食和運動數據，提供個人化的健康建議。

用戶資料：
- 目標：${userProfile?.goal || "未設定"}
- 今日餐點：${meals.map(m => `${m.name}(碳水${m.carbs}g,蛋白質${m.protein}g,脂肪${m.fat}g)`).join(", ") || "無"}
- 今日運動：${exercises.map(e => `${e.name}(${e.duration}分鐘,${e.calories}kcal)`).join(", ") || "無"}

請考慮：
1. 營養素平衡（碳水化合物、蛋白質、脂肪）
2. 熱量攝取與消耗平衡
3. 用戶的健康目標（增肌/減脂/耐力提升）
4. 生物代謝原理和營養學知識

請用繁體中文回覆，保持專業但易懂，約100-150字。`;

  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", response.status, error.slice(0, 500));
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenAI getAIRecommendation: success");
    return data.choices?.[0]?.message?.content || "無法生成建議，請稍後再試。";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "抱歉，AI 建議功能暫時無法使用。請確認 API key 是否有效。";
  }
}

export async function getWeeklyAnalysis(weekData: {
  meals: any[];
  exercises: any[];
  profile: any;
}): Promise<string> {
  const userMessage = `你是一位專業的運動營養師和生理學家。請分析用戶一週的健康數據，提供專業的週報分析。

本週數據：
- 總餐點數：${weekData.meals.length}
- 總運動次數：${weekData.exercises.length}
- 用戶目標：${weekData.profile?.goal || "未設定"}

請包含：
1. 整體營養攝取趨勢
2. 運動表現評估
3. 代謝和生理學觀點
4. 具體改進建議

請用繁體中文回覆，保持專業，約200-300字。`;

  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error (weekly):", response.status, error.slice(0, 500));
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenAI getWeeklyAnalysis: success");
    return data.choices?.[0]?.message?.content || "無法生成週報分析。";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "抱歉，週報分析功能暫時無法使用。";
  }
}

export async function getAcademicKnowledge(
  meals: any[],
  exercises: any[],
  userProfile: any
): Promise<Array<{ title: string; content: string }>> {
  const userMessage = `你是一位營養學、生物化學、生理學的權威專家。
根據用戶的飲食和運動數據，生成3個相關的學術知識點。
每個知識點應該包含：
1. 一個簡潔的標題（5-10個字）
2. 詳細但易懂的學術解釋（80-120個字）

用戶的飲食和運動數據：
- 健身目標：${userProfile?.goal || "未設定"}
- 今日餐點：${meals.map(m => `${m.name}(碳水${m.carbs}g,蛋白質${m.protein}g,脂肪${m.fat}g,卡路里${m.calories})`).join(" | ") || "無"}
- 今日運動：${exercises.map(e => `${e.name}(${e.duration}分鐘,${e.calories}kcal消耗)`).join(" | ") || "無"}

請根據上述數據生成3個相關的學術知識點。
以JSON格式回覆：[{"title":"標題1","content":"內容1"},{"title":"標題2","content":"內容2"},{"title":"標題3","content":"內容3"}]`;

  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }],
        temperature: 0.8,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error (academic):", response.status, error.slice(0, 500));
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || "[]";
    
    // 嘗試解析 JSON
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("OpenAI getAcademicKnowledge: success");
          return parsed;
        }
      }
    } catch (parseError) {
      console.error("Failed to parse academic knowledge JSON:", parseError);
    }
    
    // 返回默認值
    return [
      { title: "營養學基礎", content: "碳水化合物、蛋白質和脂肪是三大營養素，提供身體所需的能量和結構物質。" },
      { title: "運動生理學", content: "有氧運動能增強心血管系統，提高身體有氧代謝能力和耐久力。" },
      { title: "代謝科學", content: "基礎代謝率決定了身體在靜息狀態下消耗的熱量，年齡、性別和肌肉質量都會影響。" }
    ];
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return [
      { title: "營養學基礎", content: "碳水化合物、蛋白質和脂肪是三大營養素，提供身體所需的能量和結構物質。" },
      { title: "運動生理學", content: "有氧運動能增強心血管系統，提高身體有氧代謝能力和耐久力。" },
      { title: "代謝科學", content: "基礎代謝率決定了身體在靜息狀態下消耗的熱量，年齡、性別和肌肉質量都會影響。" }
    ];
  }
}
