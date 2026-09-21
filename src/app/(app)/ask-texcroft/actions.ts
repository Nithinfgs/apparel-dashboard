"use server";

import { answerQuestion } from "@/lib/ask-texcroft/intents";

export async function askTexcroft(question: string) {
  return answerQuestion(question);
}
