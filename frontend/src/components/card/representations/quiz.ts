export interface QuizQuestion {
  question: string
  options?: Record<string, string>
  correct_answer?: string
}

export interface WrongAnswerPayload {
  question: string
  options: Record<string, string>
  correct_answer?: string
  student_wrong_answer: string
}

export function pickWrongAnswerKey(question: QuizQuestion): string | null {
  const options = question.options ?? {}
  const optionKeys = Object.keys(options)
  if (!optionKeys.length) {
    return null
  }
  const wrongOptions = question.correct_answer
    ? optionKeys.filter((key) => key !== question.correct_answer)
    : optionKeys
  const pool = wrongOptions.length ? wrongOptions : optionKeys
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex] ?? null
}

export function buildWrongAnswerPayload(question: QuizQuestion): WrongAnswerPayload | null {
  if (typeof question.question !== 'string' || !question.options) {
    return null
  }
  const wrongAnswerKey = pickWrongAnswerKey(question)
  if (!wrongAnswerKey) {
    return null
  }
  return {
    question: question.question,
    options: question.options,
    correct_answer: question.correct_answer,
    student_wrong_answer: wrongAnswerKey,
  }
}

