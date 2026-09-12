require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

const PORT = process.env.PORT || 3000;


// =========================
// MIDDLEWARE
// =========================

app.use(cors());

app.use(express.json());


// =========================
// FRONTEND
// =========================

app.use(
    express.static(__dirname, {
        dotfiles: "deny"
    })
);


// =========================
// OPENAI
// =========================

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


// =========================
// AI FEEDBACK
// =========================

app.post("/api/feedback", async (req, res) => {

    try {

        const { transcript } = req.body;


        if (!transcript || !transcript.trim()) {

            return res.status(400).json({
                success: false,
                error: "Không có nội dung bài nói."
            });

        }


        const response = await client.responses.create({

            model: "gpt-5.6-luna",

            input: `

You are an expert IELTS Speaking coach.

You are analyzing an English speaking answer from a Vietnamese learner around B1-B2 level.

Your job is NOT simply to give scores.

Your job is to carefully analyze the student's actual English and give useful, specific coaching.

STUDENT'S ANSWER:

"${transcript}"


========================================
IMPORTANT SCORING RULES
========================================

Give scores from 1 to 10.

Scores can ONLY be whole numbers or end in .5.

Valid examples:

6/10
6.5/10
7/10
7.5/10
8/10
8.5/10
9/10
9.5/10
10/10

NEVER use scores such as:

6.2/10
6.3/10
7.1/10
7.4/10
8.7/10
9.1/10

Every score MUST be a whole number or end in .5.


========================================
1. GRAMMAR
========================================

Give a Grammar score.

Then analyze the student's grammar in detail.

You should:

- Identify specific grammar mistakes from the student's answer.
- Quote the incorrect phrase when useful.
- Give the corrected version.
- Explain why the correction is better.
- Comment on sentence structure.
- Comment on verb tense, articles, prepositions, subject-verb agreement, word order, or other relevant grammar issues.
- If there are no important grammar mistakes, say so instead of inventing mistakes.

Do NOT invent errors that the student did not make.


========================================
2. VOCABULARY
========================================

Give a Vocabulary score.

Analyze:

- Vocabulary range.
- Repetition.
- Basic or overly simple word choices.
- Naturalness of word choice.
- Whether the vocabulary is appropriate for IELTS Speaking.
- Useful alternatives that the student could use.

Give specific examples from the student's answer whenever possible.

For example:

Student used:
"very good"

Better alternatives:
"really effective"
"highly beneficial"
"quite impressive"

Only suggest alternatives that fit the context.


========================================
3. FLUENCY
========================================

Give a Fluency score.

Analyze:

- Sentence flow.
- Repetition.
- Whether ideas are connected naturally.
- Whether the answer develops ideas sufficiently.
- Whether the answer feels too short.
- Whether the student jumps between ideas.
- Use of linking words.
- Natural conversational flow.

Give specific advice on how to make the answer sound smoother.

Do NOT judge pronunciation from the transcript.


========================================
4. PRONUNCIATION
========================================

Give a Pronunciation score.

IMPORTANT:

The input is mainly a transcript.

You cannot reliably evaluate actual pronunciation, accent, intonation, stress, individual sounds, or connected speech from text alone.

Therefore:

- Give a cautious estimated score.
- Clearly explain that pronunciation cannot be accurately judged without audio.
- Do not invent pronunciation mistakes.
- Mention that actual audio would be needed for a reliable pronunciation assessment.


========================================
5. OVERALL SCORE
========================================

Give ONE Overall Score.

The score must be a whole number or end in .5.

Then explain why the student received this overall score.

Mention:

- Main strengths.
- Main weaknesses.
- Current approximate speaking level.
- What would most improve the answer.


========================================
6. CORRECTED ANSWER
========================================

Rewrite the student's answer into more natural English.

IMPORTANT:

- Keep the original meaning.
- Do not completely change the student's ideas.
- Keep the answer appropriate for B1-B2 level.
- Make it sound natural and spoken.
- Do not make it unnecessarily advanced.
- Improve grammar, vocabulary, sentence structure and flow.
- Keep a similar length unless the original answer is clearly too short.


========================================
7. KEY CORRECTIONS
========================================

Give several important corrections.

Use this format:

Original:
"..."

Better:
"..."

Why:
"..."


Focus on the most useful mistakes.

Do not list meaningless corrections.


========================================
8. IMPROVEMENT TIPS
========================================

Give EXACTLY 3 practical tips.

The tips must be specific and actionable.

Avoid generic advice such as:

"Practice more."

Instead give advice such as:

"Before answering, spend 5 seconds planning your answer in 3 parts: opinion, reason, example."

Each tip should help the student improve their IELTS Speaking performance.


========================================
9. USEFUL PHRASES
========================================

Give 3 useful English phrases that the student can reuse in future speaking answers.

For each phrase:

Phrase:
"..."

Meaning:
"..."

Example:
"..."


========================================
10. FINAL COACH COMMENT
========================================

End with a short but meaningful coach comment.

Tell the student what they are currently doing well and what they should focus on next.

The comment should feel like feedback from a real English speaking coach.


========================================
OUTPUT FORMAT
========================================

Use EXACTLY this structure:


Grammar: X/10

[Detailed grammar analysis]


Vocabulary: X/10

[Detailed vocabulary analysis]


Fluency: X/10

[Detailed fluency analysis]


Pronunciation: X/10

[Careful pronunciation analysis based on transcript limitations]


Overall Score: X/10

[Explanation of the overall score]


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
IMPORTANT
========================================

Be detailed and specific.

Do not give extremely short feedback.

Do not simply repeat the student's answer.

Do not invent mistakes.

Use evidence from the student's actual answer whenever possible.

The feedback should be useful to someone preparing for IELTS Speaking.

Write the feedback in Vietnamese, but keep English examples in English.

`
        });


        const feedback = response.output_text;


        res.json({

            success: true,

            feedback: feedback

        });

    } catch (error) {

        console.error(
            "OpenAI Error:",
            error
        );


        res.status(500).json({

            success: false,

            error: "Không thể kết nối với AI."

        });

    }

});


// =========================
// START SERVER
// =========================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Speaking Coach đang chạy tại: http://localhost:${PORT}`
        );

    }
);