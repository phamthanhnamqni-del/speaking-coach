require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY chưa được cấu hình trong .env");
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ================================
// HEALTH CHECK
// ================================
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Speaking Coach server is running",
        apiKeyLoaded: !!process.env.OPENAI_API_KEY
    });
});

// ================================
// IELTS SPEAKING FEEDBACK
// ================================
app.post("/api/feedback", async (req, res) => {
    try {
        const {
            transcript,
            part,
            topic,
            question
        } = req.body;

        console.log("\n========================================");
        console.log("📥 Nhận bài Speaking");
        console.log("Part:", part);
        console.log("Topic:", topic);
        console.log("Question:", question);
        console.log("Transcript:", transcript?.length || 0, "chars");
        console.log("========================================");

        // ----------------------------
        // CHECK INPUT
        // ----------------------------
        if (!transcript || !transcript.trim()) {
            return res.status(400).json({
                success: false,
                error: "Không có nội dung bài nói."
            });
        }

        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: "OPENAI_API_KEY chưa được cấu hình trong file .env."
            });
        }

        // ----------------------------
        // PROMPT NGẮN GỌN
        // ----------------------------
        const prompt = `
You are an IELTS Speaking examiner.

Evaluate the candidate's answer below.

Part: ${part || "Part 1"}
Topic: ${topic || "General"}
Question: ${question || "Not provided"}

Answer:
"${transcript.trim()}"

SCORING:
Give ONE overall score from:
5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10.

NEVER use scores such as 6.2, 7.1, 8.7, etc.

Be slightly generous but realistic.

5 = limited
5.5 = functional but weak
6 = competent
6.5 = good
7 = strong
7.5 = very strong
8+ = advanced
9-10 = exceptional and rare

Do not automatically give 5 or 5.5.
If the answer clearly deserves the higher score, choose it.

Evaluate:
- Fluency & Coherence
- Vocabulary
- Grammar
- Pronunciation (use transcript only; do not invent pronunciation problems)

Reward:
- relevant ideas
- development
- explanations/examples
- natural communication

Do not require complicated vocabulary or grammar.

IMPORTANT:
Keep feedback SHORT.

OUTPUT EXACTLY:

Overall Score: X/10

Fluency & Coherence: X/10
Vocabulary: X/10
Grammar: X/10
Pronunciation: X/10

Strengths:
- ...
- ...

Improve:
- ...
- ...

Corrections:
1. Original: ...
   Better: ...
2. Original: ...
   Better: ...

Better Answer:
Write a short, natural improved answer.
Do not make it unnecessarily advanced.

Maximum about 250 words total.
`;

        console.log("🤖 Đang gửi tới OpenAI...");

        // ----------------------------
        // OPENAI
        // ----------------------------
        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            input: prompt,

            // Giảm output để tiết kiệm TPM
            max_output_tokens: 650
        });

        const feedback = response.output_text?.trim();

        if (!feedback) {
            throw new Error("OpenAI không trả về feedback.");
        }

        console.log("✅ AI chấm thành công.");

        return res.json({
            success: true,
            feedback
        });

    } catch (error) {

        console.error("\n========================================");
        console.error("❌ OPENAI ERROR");
        console.error("Message:", error.message);
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("========================================\n");

        // ----------------------------
        // RATE LIMIT
        // ----------------------------
        if (
            error.status === 429 ||
            error.code === "rate_limit_exceeded"
        ) {
            return res.status(429).json({
                success: false,
                error:
                    "OpenAI đang hết rate limit. " +
                    "Hãy chờ rate limit reset rồi thử lại."
            });
        }

        // ----------------------------
        // API KEY
        // ----------------------------
        if (
            error.status === 401 ||
            error.code === "invalid_api_key"
        ) {
            return res.status(401).json({
                success: false,
                error:
                    "OPENAI_API_KEY không hợp lệ. " +
                    "Kiểm tra lại file .env."
            });
        }

        // ----------------------------
        // OTHER ERROR
        // ----------------------------
        return res.status(500).json({
            success: false,
            error:
                error.message ||
                "Không thể kết nối với OpenAI."
        });
    }
});

// ================================
// START SERVER
// ================================
app.listen(PORT, "0.0.0.0", () => {
    console.log("========================================");
    console.log("🚀 Speaking Coach đang chạy");
    console.log(`🌐 http://localhost:${PORT}`);

    console.log(
        `🔑 API Key: ${
            process.env.OPENAI_API_KEY
                ? "ĐÃ TẢI"
                : "CHƯA CÓ"
        }`
    );

    console.log("========================================");
});