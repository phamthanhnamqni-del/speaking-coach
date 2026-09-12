require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(
    express.static(__dirname, {
        dotfiles: "deny"
    })
);

if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY chưa được cấu hình trong file .env");
}

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Speaking Coach server is running",
        apiKeyLoaded: !!process.env.OPENAI_API_KEY
    });
});

app.post("/api/feedback", async (req, res) => {
    try {
        const {
            transcript,
            part,
            topic,
            question
        } = req.body;

        console.log("\n========================================");
        console.log("📥 Nhận yêu cầu chấm Speaking");
        console.log("Part:", part);
        console.log("Topic:", topic);
        console.log("Question:", question);
        console.log("Transcript length:", transcript?.length || 0);
        console.log("========================================\n");

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

        const currentPart = part || "part1";
        const currentTopic = topic || "General";
        const currentQuestion = question || "Not provided";

        const prompt = `
You are an experienced IELTS Speaking examiner and supportive speaking coach.

You are evaluating an English speaking answer from a Vietnamese learner.

Your scoring should be FAIR, REALISTIC, and MODERATELY GENEROUS.

The purpose is to give the student a useful estimate of their current speaking ability.

Do NOT artificially inflate scores.

Do NOT artificially lower scores.

Do NOT invent mistakes.

Do NOT assume mistakes that are not demonstrated.

Do not be overly strict about normal second-language mistakes.

Focus primarily on the student's ability to communicate ideas clearly, develop answers, use vocabulary and grammar effectively, and maintain understandable communication.

A student does NOT need perfect English to receive 6.5 or 7.

The presence of some grammar mistakes does NOT automatically mean the student should receive 5 or 5.5.

The overall quality of communication matters more than counting individual mistakes.

The student is practicing:

Part: ${currentPart}
Topic: ${currentTopic}
Question: "${currentQuestion}"

STUDENT'S ANSWER:

"${transcript}"

========================================
SCORING SYSTEM
========================================

Give scores from 1 to 10.

Scores can ONLY be whole numbers or end in .5.

Valid scores:

5/10
5.5/10
6/10
6.5/10
7/10
7.5/10
8/10
8.5/10
9/10
9.5/10
10/10

NEVER use:

5.2/10
5.3/10
6.2/10
6.3/10
7.1/10
7.4/10
8.7/10
9.1/10

Every score MUST end in .0 or .5.

========================================
IMPORTANT SCORE CALIBRATION
========================================

Do NOT make 5.5 the default score.

Do NOT keep a reasonably good answer at 5.5 simply because it contains grammar mistakes.

Do NOT assume that a Vietnamese learner should normally score 5 or 5.5.

Judge the actual answer.

Use the following approximate calibration:

5.0:
Basic communication with noticeable limitations.

5.5:
Functional communication with noticeable weaknesses.

6.0:
Competent communication.
The student answers clearly, gives reasons or details, and communicates ideas effectively despite mistakes.

6.5:
Good communication.
The student develops ideas clearly, uses reasonably varied vocabulary and grammar, and communicates naturally enough.

7.0:
Strong communication.
The student develops ideas well, uses a useful range of vocabulary and grammar, and communicates clearly and naturally.

7.5:
Very strong performance.
Strong development, flexibility, control, vocabulary range, and generally natural communication.

8.0+:
Advanced performance.
Clear evidence of high range, accuracy, flexibility, precision, and natural communication is required.

If an answer is clearly better than 5.5, give 6 or higher.

If an answer is clearly better than 6, give 6.5 or higher.

If an answer clearly demonstrates strong performance, give 7 or higher.

Do NOT artificially hold scores down.

========================================
MODERATE GENEROSITY RULE
========================================

When deciding between two nearby scores, consider the overall communication.

If a student is between 5.5 and 6 because of minor errors but communicates ideas clearly and develops them reasonably well, prefer 6.

If a student is between 6 and 6.5 and demonstrates good development, useful vocabulary range, and generally effective grammar, prefer 6.5.

If a student is between 6.5 and 7 and demonstrates clear development, good flexibility, and generally natural communication, prefer 7.

If a student is between 7 and 7.5 and demonstrates noticeably stronger control and flexibility, 7.5 can be appropriate.

Do NOT automatically round every score upward.

The higher score must still be supported by the overall performance.

========================================
WHAT SHOULD NOT LOWER THE SCORE TOO MUCH
========================================

Do NOT heavily penalize:

* occasional grammar mistakes
* minor article mistakes
* occasional preposition mistakes
* occasional tense mistakes
* repetition that does not seriously limit communication
* simple but correct vocabulary
* natural use of common words
* minor awkward wording
* occasional self-correction
* small vocabulary gaps

These issues matter, but judge them according to their actual impact.

Do NOT count every individual error as a major weakness.

========================================
PART 1
========================================

Part 1 should be natural and conversational.

Do NOT require a long speech.

A concise but well-developed answer can score well.

Evaluate:

* direct answer
* relevance
* reason
* explanation
* detail
* natural conversational language
* vocabulary
* grammar
* ability to extend naturally

========================================
PART 2
========================================

Evaluate:

* cue card coverage
* development
* organization
* sequencing
* vocabulary flexibility
* grammatical variety
* transitions
* repetition
* ability to maintain ideas

Do not reward length alone.

A reasonably developed answer can receive 6 or 6.5.

A clearly strong and flexible answer can receive 7 or 7.5.

========================================
PART 3
========================================

Evaluate:

* explanation
* causes
* effects
* examples
* comparisons
* advantages/disadvantages
* opinions
* broader issues
* future developments

Do not require every element in every answer.

A clear opinion with explanation and an example can be a solid response.

Do not keep a clearly well-developed Part 3 answer at 5.5 merely because vocabulary is not advanced.

========================================
GRAMMAR
========================================

Evaluate:

* accuracy
* range
* sentence structure
* tense
* articles
* prepositions
* agreement
* word order
* conditionals
* relative clauses
* conjunctions
* complex sentences

Do not punish every small mistake heavily.

Never invent errors.

========================================
VOCABULARY
========================================

Evaluate:

* range
* precision
* flexibility
* repetition
* collocations
* natural word choice
* paraphrasing
* topic vocabulary

Common words are NOT automatically weak vocabulary.

Simple but accurate vocabulary can still support 6 or 6.5.

========================================
FLUENCY
========================================

Evaluate:

* continuity
* repetition
* self-correction
* ability to extend
* logical progression
* linking
* natural flow
* relevance
* development

Transcript-based evaluation cannot perfectly measure pauses.

Do not claim to know exact hesitation frequency unless visible.

========================================
PRONUNCIATION
========================================

The input is mainly a transcript.

You CANNOT reliably determine:

* actual pronunciation
* individual sounds
* accent
* word stress
* sentence stress
* intonation
* connected speech

Therefore:

* Do not invent pronunciation mistakes.
* Give only a cautious estimated score.
* Clearly state that actual audio is required.
* Pronunciation MUST NOT become a major reason for lowering the overall score when audio is unavailable.

========================================
OVERALL SCORE
========================================

Give ONE Overall Score.

The score MUST end in .0 or .5.

Do NOT simply average the four category scores mechanically.

Use examiner judgment.

A few grammar mistakes should not outweigh otherwise strong communication.

Common vocabulary should not outweigh clear expression.

Lack of advanced vocabulary should not automatically prevent 6.5.

Lack of perfect grammar should not automatically prevent 7.

If the answer demonstrates good development, clear communication, reasonable range, and generally effective control, allow 6.5 or 7.

If the answer demonstrates strong flexibility and control, allow 7.5.

8+ requires clearly advanced performance.

Always explain:

* strongest aspects
* biggest weaknesses
* approximate current level
* what prevents the next score
* the single most important improvement

========================================
CORRECTED ANSWER
========================================

Rewrite the student's answer into more natural English.

Keep:

* original meaning
* main ideas
* appropriate level
* spoken and natural style

Do not turn a B1 answer into an unnatural C1 speech.

========================================
KEY CORRECTIONS
========================================

Give EXACTLY 3.

1.

Original:
"..."

Better:
"..."

Why:
"..."

2.

Original:
"..."

Better:
"..."

Why:
"..."

3.

Original:
"..."

Better:
"..."

Why:
"..."

Only use genuine problems or meaningful improvements.

========================================
IMPROVEMENT TIPS
========================================

Give EXACTLY 3 practical and specific tips.

Do NOT use generic advice such as:

"Practice more."

"Learn more vocabulary."

"Speak English every day."

========================================
USEFUL PHRASES
========================================

Give EXACTLY 3 useful English phrases.

For each:

Phrase:
"..."

Meaning:
"..."

Example:
"..."

========================================
FINAL COACH COMMENT
========================================

End with a short meaningful coach comment.

Acknowledge genuine strengths.

Identify the main weakness.

Tell the student what to focus on next.

Avoid empty praise.

========================================
OUTPUT FORMAT
========================================

Grammar: X/10

[Detailed grammar analysis]

Vocabulary: X/10

[Detailed vocabulary analysis]

Fluency: X/10

[Detailed fluency analysis]

Pronunciation: X/10

[Careful pronunciation analysis based on transcript limitations]

Overall Score: X/10

[Detailed explanation]

Corrected Answer:

[Improved answer]

Key Corrections:

1.

Original:
"..."
Better:
"..."
Why:
"..."

2.

Original:
"..."
Better:
"..."
Why:
"..."

3.

Original:
"..."
Better:
"..."
Why:
"..."

Improvement Tips:

1. ...

2. ...

3. ...

Useful Phrases:

1.

Phrase:
"..."
Meaning:
"..."
Example:
"..."

2.

Phrase:
"..."
Meaning:
"..."
Example:
"..."

3.

Phrase:
"..."
Meaning:
"..."
Example:
"..."

Final Coach Comment:

[Short final coaching comment]

========================================
FINAL SCORING RULES
========================================

1. Be fair and supportive.
2. Be moderately generous but realistic.
3. Do not artificially inflate scores.
4. Do not intentionally keep scores low.
5. 5.5 is NOT the default score.
6. Do NOT cluster most answers around 5 or 5.5.
7. Competent communication can receive 6.
8. Good development can receive 6.5.
9. Strong communication can receive 7.
10. Very strong performance can receive 7.5.
11. 8+ requires clear advanced ability.
12. A few normal grammar mistakes should not dominate.
13. Simple vocabulary should not automatically lower the score.
14. Long answers are not automatically high-scoring.
15. Advanced vocabulary is not automatically good vocabulary.
16. Few grammar mistakes are not automatically advanced grammar.
17. Part 3 requires stronger development than Part 1.
18. Part 2 requires sustained development.
19. Do not invent mistakes.
20. Do not judge pronunciation from transcript as if audio were available.
21. Feedback must be specific.
22. Write feedback in Vietnamese.
23. Keep English examples in English.
24. Scores MUST use only .0 or .5.
25. 8.5, 9, 9.5 and 10 should be RARE.
26. Do not use nationality as a scoring factor.
27. If the student clearly performs above 5.5, give 6 or higher.
28. If the student clearly performs above 6, give 6.5 or higher.
29. If the student clearly performs at a strong 6.5-7 level, give 7.
30. Do not automatically round every answer upward.
31. Judge the overall communication, not merely the number of errors.
`;

        console.log("🤖 Đang gửi request tới OpenAI...");

        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            input: prompt
        });

        console.log("✅ OpenAI trả kết quả thành công.");

        const feedback = response.output_text;

        if (!feedback) {
            throw new Error("OpenAI không trả về output_text.");
        }

        res.json({
            success: true,
            feedback: feedback
        });

    } catch (error) {
        console.error("\n========================================");
        console.error("❌ OPENAI ERROR");
        console.error("Message:", error.message);
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("Type:", error.type);
        console.error("Full error:", error);
        console.error("========================================\n");

        res.status(500).json({
            success: false,
            error: error.message || "Không thể kết nối với AI."
        });
    }
});

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