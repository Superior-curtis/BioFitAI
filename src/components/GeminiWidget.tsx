import React, { useState } from "react";

const GeminiWidget: React.FC = () => {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_URL = import.meta.env.VITE_GEMINI_URL;
  const AUTH_TYPE = import.meta.env.VITE_GEMINI_AUTH_TYPE || "bearer"; // "bearer" | "x-api-key" | "query"

  const [prompt, setPrompt] = useState("");
  const [responseText, setResponseText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendPrompt = async () => {
    setError(null);
    setResponseText(null);
    if (!GEMINI_URL || !API_KEY) {
      setError("請在 .env 設定 VITE_GEMINI_API_KEY 與 VITE_GEMINI_URL");
      return;
    }

    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // 準備 body (請依據目標 API 調整結構)
      const body = {
        prompt,
        temperature: 0.7,
        max_output_tokens: 256,
      };

      // 支援三種認證方式：bearer / x-api-key / query
      let url = GEMINI_URL;
      if (AUTH_TYPE === "query") {
        const sep = GEMINI_URL.includes("?") ? "&" : "?";
        url = `${GEMINI_URL}${sep}key=${encodeURIComponent(API_KEY)}`;
      } else if (AUTH_TYPE === "x-api-key") {
        headers["x-api-key"] = API_KEY;
      } else {
        headers["Authorization"] = `Bearer ${API_KEY}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const txt = await res.text();
      if (!res.ok) {
        setError(`Status ${res.status}: ${txt}`);
      } else {
        // 嘗試 parse JSON，若失敗就顯示純文字
        try {
          const j = JSON.parse(txt);
          setResponseText(JSON.stringify(j, null, 2));
        } catch (e) {
          setResponseText(txt);
        }
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 rounded-md bg-muted/10">
      <h3 className="text-lg font-medium mb-2">Gemini 測試工具（前端直呼）</h3>
      <p className="text-sm text-muted-foreground mb-3">注意：這會把 API 金鑰放在前端，僅限測試使用。</p>
      <textarea
        className="w-full min-h-[100px] p-2 rounded border"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="輸入給 Gemini 的 prompt"
      />
      <div className="flex gap-2 mt-2">
        <button
          className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
          onClick={sendPrompt}
          disabled={loading}
        >
          {loading ? "傳送中..." : "傳送"}
        </button>
        <button
          className="px-4 py-2 rounded border"
          onClick={() => {
            setPrompt("");
            setResponseText(null);
            setError(null);
          }}
        >
          清除
        </button>
      </div>

      {error && (
        <pre className="mt-3 text-red-600 whitespace-pre-wrap">{error}</pre>
      )}

      {responseText && (
        <div className="mt-3">
          <div className="text-sm text-muted-foreground mb-2">回傳結果：</div>
          <pre className="bg-black/5 p-3 rounded overflow-auto whitespace-pre-wrap">{responseText}</pre>
        </div>
      )}
    </div>
  );
};

export default GeminiWidget;
