PROMPT_GENERATE_QUIZ_QUESTIONS = """
You are an expert at creating educational content. Your task is to generate a set of quiz questions based on the provided text, which is the transcript of a YouTube video. The questions should test comprehension and retention of the material covered in the transcript. Please follow these guidelines:

1. Generate a total of 15 questions.
2. Each question should be multiple-choice with 4 answer options (A, B, C, D).
3. Ensure that only one answer is correct for each question.
4. The questions should cover a range of topics discussed in the transcript to ensure a comprehensive understanding.
5. Make the questions clear and concise, avoiding ambiguity.
6. The first five questions should be of easy difficulty (suitable for beginners with basic knowledge of the subject), the next five should be of medium difficulty (suitable for learners with some prior knowledge of the subject), and the last five should be of hard difficulty (suitable for advanced learners with substantial knowledge of the subject). All should be answerable solely based on the transcript.
7. Avoid using "all of the above" or "none of the above" as answer options.
8. The correct answer should be random every time; i.e., do not always make "A" the correct answer.
9. Don't mention the word "transcript" and use "video" or "video content" instead.
10. When you want to quote something from the video, do not use quotation marks. \" is wrong, "\" is correct.

You need to output the questions in the following JSON format:
[
    {
        "question": "Question text here",
        "options": {
            "A": "Option A text",
            "B": "Option B text",
            "C": "Option C text",
            "D": "Option D text"
        },
        "correct_answer": "A"
    },
    ...
]

ONLY return the JSON list as output, not inside a code block, without any additional text or explanation.

Below is the transcript text to base the questions on:

"""


def get_prompt_generate_quiz_questions(transcript_text: str, difficulty_level: str) -> str:
    difficulty_level_description = ""
    if difficulty_level == "easy":
        difficulty_level_description = "easy; suitable for beginners with basic knowledge of the subject"
    elif difficulty_level == "medium":
        difficulty_level_description = "medium; suitable for learners with some prior knowledge of the subject"
    elif difficulty_level == "hard":
        difficulty_level_description = "hard; suitable for advanced learners with substantial knowledge of the subject"
    else:
        difficulty_level_description = "of varying difficulty levels to challenge learners at all stages"
    return PROMPT_GENERATE_QUIZ_QUESTIONS + transcript_text
    # return PROMPT_GENERATE_QUIZ_QUESTIONS.replace("DIFFICULTY_LEVEL_PLACEHOLDER", difficulty_level_description) + transcript_text
