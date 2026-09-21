"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Send } from "lucide-react";
import { askTexcroft } from "./actions";
import { SAMPLE_QUESTIONS, type AskAnswer } from "@/lib/ask-texcroft/shared";

interface Exchange {
  question: string;
  answer: AskAnswer;
}

export function AskPanel() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const [isPending, startTransition] = useTransition();

  function ask(q: string) {
    if (!q.trim()) return;
    startTransition(async () => {
      const answer = await askTexcroft(q);
      setHistory((h) => [{ question: q, answer }, ...h]);
      setQuestion("");
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2"
      >
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about orders, risk, dispatch, factories, payments…" className="h-11" />
        <Button type="submit" disabled={isPending} className="h-11">
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SAMPLE_QUESTIONS.map((sq) => (
          <button
            key={sq}
            onClick={() => ask(sq)}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {sq}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {history.map((ex, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 py-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" /> {ex.question}
              </p>
              <p className="text-sm font-medium text-foreground">{ex.answer.summary}</p>
              {ex.answer.rows.length > 0 && (
                <ul className="divide-y divide-border/70 rounded-md border border-border">
                  {ex.answer.rows.map((r, ri) => (
                    <li key={ri} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-muted-foreground">{r.detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
