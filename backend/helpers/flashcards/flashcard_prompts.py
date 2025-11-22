
PROMPT_GENERATE_QA_FLASHCARDS = """
You are an expert at creating educational content. Your task is to generate a set of flashcards based on the quiz questions that the student has answered wrongly. Each flashcard should help the student understand and remember the correct information. Please follow these guidelines:

1. For each question, create EXACTLY one flashcard.
2. Ensure that the explanations are clear and concise, aiding in comprehension and retention.
3. Do not make flashcards a duplicate of the question; instead, focus on providing a question/answer pair that reinforces the correct information in a generalizable way.
4. Pay attention to tailor the flashcards to address the specific misunderstandings indicated by the wrong answers the student provided.

You need to output the flashcards in the following JSON format:
[
    {
        "question": "Flashcard question text here",
        "answer": "Flashcard answer text here"
    },
    ...
]

and the length of the output list should be equal to the number of questions provided below.

ONLY return the JSON list as output, not inside a code block, without any additional text or explanation.

Below are the quiz questions and the student's wrong answers to base the flashcards on:

"""

# Expects as input:
# [
#     {
#         "question": "Question text here",
#         "options": {
#             "A": "Option A text",
#             "B": "Option B text",
#             "C": "Option C text",
#             "D": "Option D text"
#         },
#         "correct_answer": "A",
#         "student_wrong_answer": "B"
#     },
#     ...
# ]
def get_prompt_generate_qa_flashcards(quiz_questions_with_wrong_answers: str) -> str:
    return PROMPT_GENERATE_QA_FLASHCARDS + str(quiz_questions_with_wrong_answers)