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

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/feedback", async (req, res) => {
    try {
        const {
            transcript,
            part,
            topic,
            question
        } = req.body;

        if (!transcript || !transcript.trim()) {
            return res.status(400).json({
                success: false,
                error: "Không có nội dung bài nói."
            });
        }

        const currentPart = part || "part1";
        const currentTopic = topic || "General";
        const currentQuestion = question || "Not provided";

        const prompt = `
You are an experienced IELTS Speaking examiner and supportive speaking coach.

You are evaluating an English speaking answer from a Vietnamese learner.

Your scoring must be FAIR, REALISTIC, and SLIGHTLY GENEROUS rather than excessively strict.

The student is practicing IELTS Speaking.

Your job is to identify genuine weaknesses, but DO NOT punish the student excessively for normal learner mistakes.

The goal is to give a realistic score that helps the student understand their current ability.

Do NOT artificially inflate scores.

Do NOT artificially lower scores.

Do NOT invent mistakes.

Do NOT assume mistakes that are not demonstrated.

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

Valid examples:

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
FAIR SCORE ANCHORS
========================================

IMPORTANT:

For a normal Vietnamese IELTS learner who can communicate their ideas clearly but still makes grammar mistakes, repeats vocabulary, or mainly uses simple structures, DO NOT automatically give a score below 5.

A reasonably understandable answer with relevant ideas will usually fall around 5.0-6.0.

A solid and reasonably developed answer will usually fall around 5.5-6.5.

A clearly strong answer with good development and some flexibility can reach 6.5-7.0+.

7+ requires clear evidence of stronger language ability.

Do NOT make 7+ impossible.

Do NOT make 5-6 unnecessarily difficult to achieve.

Use the following general anchors:

1-3:
Very limited communication.
Frequent problems make communication difficult.

4:
Basic communication is possible, but serious limitations frequently affect the answer.
Ideas may be very short, unclear, or difficult to develop.

5:
The student can communicate the main message and answer the question.
Language is often simple.
There may be noticeable grammar mistakes, repetition, limited vocabulary, or weak development.
However, the answer remains generally understandable.

5.5:
The student communicates reasonably well.
Ideas are relevant and can be developed to some extent.
There are noticeable mistakes and limitations, but they do not usually prevent understanding.

6:
A competent and understandable answer.
The student can explain ideas, give reasons, and provide some detail.
Grammar and vocabulary may still contain mistakes and repetition.
Language may be mostly simple, but communication is generally effective.

6.5:
A good answer with clear development.
The student demonstrates some vocabulary range, grammatical variety, and flexibility.
Mistakes may still occur, but communication is generally smooth and effective.

7:
A strong answer.
Ideas are well developed.
Vocabulary is reasonably varied and appropriate.
There is a good mixture of simple and complex grammar.
Mistakes are present but generally minor and do not significantly affect communication.

7.5:
A very strong performance with good control, flexibility, development, and natural communication.

8:
Advanced performance.
Wide vocabulary, strong grammatical control, strong development, and generally natural communication.

8.5:
Very high-level performance.
Consistently flexible, precise, natural, and well-developed.

9-10:
Exceptional performance.
These scores should be RARE.

========================================
IMPORTANT SCORE CALIBRATION
========================================

Use these guidelines carefully:

If the answer is understandable, relevant, and gives some development, do NOT automatically score it 4 or below.

If the answer has common learner grammar mistakes but the meaning is clear, the score can still be 5.0-6.0.

If vocabulary is mostly common but used appropriately, do NOT heavily penalize it.

Using simple vocabulary is NOT the same as having poor vocabulary.

If grammar is mostly simple but understandable, do NOT automatically give a low grammar score.

If the student gives a clear answer with a reason and an example, this should normally be considered at least functional communication.

For a normal answer that is clearly understandable but not advanced, strongly consider the 5.5-6.0 range.

For a reasonably good answer with some range and development, strongly consider the 6.0-6.5 range.

Only move clearly below 5 when there are substantial problems with communication, relevance, development, or control.

Do not give 7 simply because the answer is correct.

Do not give 8 simply because the answer is fluent.

Do not give a high score because the answer is long.

However, do not give a low score simply because the answer is not advanced.

========================================
PART 1
========================================

Part 1 should be natural and conversational.

Do NOT require a long speech.

A short but relevant Part 1 answer can still receive a reasonable score if it answers the question naturally.

Look for:

* direct answer
* reason
* explanation
* detail
* example when appropriate
* natural conversational language
* reasonable vocabulary
* grammatical variety where demonstrated

Do not require every element in every answer.

For Part 1, do not punish the student for giving an answer that is naturally concise.

========================================
PART 2
========================================

Part 2 requires sustained speaking.

Evaluate:

* coverage of the cue card
* development of ideas
* organization
* sequencing
* vocabulary flexibility
* grammatical variety
* transitions
* repetition
* ability to maintain ideas
* ability to continue developing the topic

Do not reward length alone.

However, do not punish a student heavily simply because the answer is not extremely sophisticated.

A reasonably developed answer with understandable communication can still be around 5.5-6.5.

========================================
PART 3
========================================

Part 3 is more demanding.

Expect stronger development than Part 1.

Depending on the question, evaluate the student's ability to:

* explain why
* discuss causes
* discuss effects
* give examples
* compare ideas
* discuss advantages and disadvantages
* support opinions
* qualify opinions
* discuss broader social issues
* discuss possible future developments

Do not require all of these in every answer.

A Part 3 answer that gives a clear opinion plus explanation and an example can still receive a reasonable 5.5-6.5 even if the language is not advanced.

Superficial answers should receive lower scores when the question clearly requires analysis.

========================================
1. GRAMMAR
========================================

Give a Grammar score.

Evaluate BOTH accuracy and range.

Check:

* grammatical accuracy
* sentence structure
* verb tense
* articles
* prepositions
* subject-verb agreement
* countable and uncountable nouns
* pronouns
* word order
* conditionals
* relative clauses
* conjunctions
* complex sentences
* other relevant structures

IMPORTANT:

Do not punish every small grammar mistake heavily.

Normal learner mistakes are expected.

If mistakes do not interfere with understanding, the grammar score can still be around 5-6.

If the student demonstrates some variety in sentence structures, recognize it even if errors remain.

Few mistakes do NOT automatically mean a high grammar score.

However, simple grammar does NOT automatically mean a low score.

Judge what the student actually demonstrates.

Identify genuine errors only.

Never invent errors.

========================================
2. VOCABULARY
========================================

Give a Vocabulary score.

Evaluate:

* vocabulary range
* precision
* flexibility
* repetition
* collocations
* natural word choice
* paraphrasing ability
* topic-specific vocabulary
* overuse of basic words

Words such as:

good
nice
bad
very
interesting
thing
stuff
people
really
like
because
I think

are NOT automatically problems.

Only reduce the score significantly when the student relies on them excessively or cannot express ideas clearly.

Common vocabulary used naturally and accurately can still receive a reasonable score.

Do not reward complicated vocabulary merely because it sounds advanced.

Incorrect or unnatural advanced vocabulary should NOT increase the score.

========================================
3. FLUENCY
========================================

Give a Fluency score.

Evaluate:

* continuity of ideas
* repetition
* self-correction when visible
* ability to extend ideas
* logical progression
* linking
* natural conversational flow
* relevance
* whether the answer feels naturally developed

Transcript-based evaluation cannot perfectly capture pauses.

Do not claim to know exact hesitation frequency unless the transcript shows it.

Do not judge pronunciation from the transcript.

A long answer is NOT automatically fluent.

A short answer is NOT automatically weak.

If the student communicates ideas clearly and logically, recognize this positively.

========================================
4. PRONUNCIATION
========================================

Give a cautious Pronunciation score.

IMPORTANT:

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
* Clearly state that the score is provisional.
* Explain that actual audio is required for a reliable pronunciation assessment.

If only transcript text is available, pronunciation MUST NOT become a major reason for lowering the overall score.

When there is insufficient evidence, keep the pronunciation assessment relatively neutral rather than using it to punish the student.

========================================
5. OVERALL SCORE
========================================

Give ONE Overall Score.

The score MUST end in .0 or .5.

Do NOT simply average the four category scores mechanically.

Use examiner judgment.

However, the Overall Score must remain consistent with the category scores.

IMPORTANT CALIBRATION:

A generally understandable answer with relevant content and some development will usually be around 5.0-6.0.

A reasonably good answer with clear development and some language range will usually be around 6.0-6.5.

A clearly strong answer with good flexibility can reach 7+.

Do not lower the overall score excessively because of a few grammar mistakes.

Do not lower the overall score excessively because the student uses common vocabulary.

Do not lower the overall score excessively because pronunciation cannot be evaluated from transcript.

A major weakness can prevent a high overall score, but ordinary learner mistakes should not destroy the overall score.

Always explain:

* strongest aspects
* biggest weaknesses
* approximate current level
* what prevents the next score level
* the single most important improvement

========================================
6. CORRECTED ANSWER
========================================

Rewrite the student's answer into more natural English.

IMPORTANT:

* Keep the original meaning.
* Keep the student's main ideas.
* Do not completely replace the ideas.
* Keep the answer appropriate for the student's likely level.
* Make it sound spoken and natural.
* Do not turn a B1 answer into an unnatural C1 speech.
* Improve grammar, vocabulary, sentence structure and flow.
* Keep a similar length unless the original is clearly too short.

========================================
7. KEY CORRECTIONS
========================================

Give EXACTLY 3 important corrections or improvements.

Use:

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

Do not invent errors.

If there are fewer than three grammar mistakes, include improvements in:

* naturalness
* vocabulary
* sentence structure
* collocation

========================================
8. IMPROVEMENT TIPS
========================================

Give EXACTLY 3 practical tips.

Each tip must be specific and actionable.

Do not give generic advice such as:

"Practice more."

"Learn more vocabulary."

"Speak English every day."

Tips must be connected to weaknesses in the student's actual answer.

========================================
9. USEFUL PHRASES
========================================

Give EXACTLY 3 useful English phrases.

They should be relevant to the student's topic or weaknesses.

For each:

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

The comment should:

* acknowledge genuine strengths
* identify the main weakness
* tell the student what to focus on next
* avoid empty praise

Do not call the student excellent unless the evidence supports it.

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

[Detailed explanation of the overall score]

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
FINAL FAIR SCORING RULES
========================================

1. Be fair and supportive.
2. Do not inflate scores.
3. Do not intentionally give low scores.
4. High scores require clear evidence.
5. A correct but basic answer is not automatically high-level.
6. A long answer is not automatically high-level.
7. Advanced vocabulary is not automatically good vocabulary.
8. Few grammar mistakes are not automatically advanced grammar.
9. Part 3 requires stronger idea development than Part 1.
10. Part 2 requires sustained development rather than repetition.
11. Do not invent mistakes.
12. Do not judge pronunciation from transcript as if audio were available.
13. Always explain what prevents the student from reaching the next score level.
14. Feedback must be specific to the student's actual answer.
15. Write the feedback in Vietnamese.
16. Keep English examples in English.
17. Scores MUST use only .0 or .5.
18. Scores of 8.5, 9, 9.5 and 10 should be RARE.
19. For a reasonably understandable and relevant answer, strongly consider the 5.0-6.0 range.
20. For a reasonably good and developed answer, strongly consider the 5.5-6.5 range.
21. Do not punish normal learner mistakes more heavily than their actual impact on communication.
22. The purpose of scoring is to give a useful estimate of the student's current ability, not to make the score unnecessarily low.
`;

        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            input: prompt
        });

        const feedback = response.output_text;

        res.json({
            success: true,
            feedback: feedback
        });

    } catch (error) {
        console.error("OpenAI Error:", error);

        res.status(500).json({
            success: false,
            error: "Không thể kết nối với AI."
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        "Speaking Coach đang chạy tại: http://localhost:" + PORT
    );
});