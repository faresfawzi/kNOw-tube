
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

PROMPT_GENERATE_MUTITYPE_FLASHCARDS = """
You are an expert at creating educational content.
Your task is to generate a set of four flashcards of different types based only on the information in the given video transcript excerpt.

You will receive a subsection of a video transcript. From this transcript, you must:
	1.	Create a knowledge flashcard that briefly summarizes the key pieces of knowledge.
	2.	Create a multiple choice question flashcard.
	3.	Create a cloze deletion flashcard.
	4.	Create a Q&A flashcard.

Requirements
	•	Use only information that appears in the transcript. Do not invent new facts.
	•	Each flashcard must be concise, clear, and factually accurate.
	•	The four flashcards must cover important and non-redundant aspects of the transcript.
	•	You must output valid JSON only, with no extra text before or after.
	•	When you want to quote something from the video, do not use quotation marks. 

JSON Output Format

Return a single JSON object with a flashcards array.
Each flashcard is an object with a card_type field and type-specific fields as follows:

{
  "flashcards": [
    {
      "card_type": "knowledge",
      "knowledge_summary": "string – brief summary of the key concepts from the transcript."
    },
    {
      "card_type": "multiple_choice",
      "question": "string – a clear question based on the transcript.",
      "choices": [
        "string – option A",
        "string – option B",
        "string – option C",
        "string – option D"
      ],
      "correct_choice_index": 1,
      "explanation": "string – brief explanation of why this answer is correct (optional but preferred)."
    },
    {
      "card_type": "cloze",
      "cloze_text": "string – a sentence from or faithful to the transcript with one key part hidden, e.g. 'The main benefit of X is {{c1::Y}}.'",
      "hint": "string – short hint to help recall (optional)."
    },
    {
      "card_type": "qa",
      "question": "string – short, focused question about the content.",
      "answer": "string – concise answer based on the transcript.",
      "explanation": "string – optional elaboration or context."
    }
  ]
}

Transcript Excerpt:
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

def get_prompt_generate_multitype_flashcards(transcript: str) -> str:
    return PROMPT_GENERATE_MUTITYPE_FLASHCARDS + "\n" + str(transcript)