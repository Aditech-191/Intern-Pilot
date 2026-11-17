"use client";

import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import {
  Send,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  FilePlus2,
  AlertCircle,
} from "lucide-react";
import { ChatMessage, Opportunity, StudentProfile } from "@/types";
import {
  calculateSkillAlignment,
  extractCitedOpportunityIds,
  getDeadlineInfo,
} from "@/lib/opportunity-utils";

interface CareerAdvisorViewProps {
  profile: StudentProfile;
  opportunities: Opportunity[];
  onInspectOpportunity: (opportunity: Opportunity) => void;
  onOpenParse: () => void;
}

const STARTER_PROMPTS = [
  "Which of my added opportunities matches my skills best?",
  "Which deadlines are closing soonest and what should I prepare first?",
  "What skills am I missing across my saved opportunities?",
];

export function CareerAdvisorView({
  profile,
  opportunities,
  onInspectOpportunity,
  onOpenParse,
}: CareerAdvisorViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          opportunities,
          message: query,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-err-${Date.now()}`,
            role: "assistant",
            content:
              json.error ||
              "Unable to reach the Career Advisor right now. Please try again.",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            error: true,
          },
        ]);
        return;
      }

      const answer: string = json.response || "";
      const citedIds = extractCitedOpportunityIds(answer, opportunities);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          role: "assistant",
          content: answer,
          citedOpportunityIds: citedIds,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-net-${Date.now()}`,
          role: "assistant",
          content: "Network error contacting the Career Advisor. Please retry.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5 flex flex-col min-h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Career Advisor
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Honest skill-gap feedback and deadline prioritization grounded
            strictly in your workspace entries.
          </p>
        </div>

        <span className="font-mono tabular-nums text-xs text-ink-secondary">
          {opportunities.length}{" "}
          {opportunities.length === 1 ? "opportunity" : "opportunities"} in
          context
        </span>
      </div>

      {/* Grounding Guarantee Banner */}
      <div className="rounded-2xl border border-primary/30 bg-primary-container/35 px-4 py-3 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-ink leading-relaxed">
          <strong>Workspace-Only Grounding:</strong> The advisor answers
          strictly from the opportunities you have added to CrestPath and never
          invents external listings, application links, or deadlines.
        </p>
      </div>

      {/* Chat Viewport */}
      <section
        aria-label="Career advisor conversation"
        className="flex-1 rounded-2xl border border-outline bg-surface flex flex-col overflow-hidden min-h-[420px]"
      >
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          {opportunities.length === 0 ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3 py-8">
              <h2 className="font-display text-lg font-semibold text-ink">
                No opportunities in your workspace yet
              </h2>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Because CrestPath never invents listings or uses dummy data, add
                at least one internship, scholarship, or fellowship first so the
                advisor can compare it against your skills and deadlines.
              </p>
              <button
                type="button"
                onClick={onOpenParse}
                className="min-h-[44px] px-5 rounded-[10px] bg-primary hover:opacity-90 text-white dark:text-[#04261D] text-sm font-semibold inline-flex items-center gap-2 transition-opacity"
              >
                <FilePlus2 className="w-4 h-4" />
                Add Your First Opportunity
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-6 space-y-5 max-w-2xl">
              <div className="space-y-1.5">
                <h2 className="font-display text-base font-semibold text-ink">
                  Ask about your {opportunities.length} saved{" "}
                  {opportunities.length === 1 ? "listing" : "listings"}
                </h2>
                <p className="text-sm text-ink-secondary">
                  Choose a starter question or type your own below.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="min-h-[44px] px-4 py-2 rounded-[10px] border border-outline bg-surface-low hover:border-primary/50 text-left text-xs sm:text-sm font-medium text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const citedOpps = (msg.citedOpportunityIds || [])
                .map((id) => opportunities.find((o) => o.id === id))
                .filter((o): o is Opportunity => Boolean(o));

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-white dark:text-[#04261D]"
                        : msg.error
                        ? "bg-tertiary-container/60 border border-tertiary/40 text-on-tertiary-container"
                        : "bg-surface-low border border-outline text-ink"
                    }`}
                  >
                    {msg.error ? (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{msg.content}</span>
                      </div>
                    ) : msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 text-ink">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>

                  {/* Clickable Cited Opportunity Cards */}
                  {citedOpps.length > 0 && (
                    <div className="mt-2.5 w-full max-w-[90%] sm:max-w-[78%] grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {citedOpps.map((opp) => {
                        const align = calculateSkillAlignment(
                          profile.skills,
                          opp.requirements
                        );
                        const dl = getDeadlineInfo(opp.deadline);
                        return (
                          <button
                            key={opp.id}
                            type="button"
                            onClick={() => onInspectOpportunity(opp)}
                            className="p-3 rounded-xl border border-outline bg-surface hover:border-primary text-left transition-colors flex items-start justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-ink truncate">
                                {opp.title}
                              </p>
                              <p className="text-[11px] text-ink-secondary truncate">
                                {opp.organization} · {dl.label}
                              </p>
                              {align.percentage !== null && (
                                <p className="font-mono tabular-nums text-[11px] text-strong mt-1">
                                  {align.percentage}% skill alignment
                                </p>
                              )}
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-primary shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <span className="font-mono text-[11px] text-ink-secondary mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-ink-secondary">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Reviewing your workspace opportunities...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-3.5 border-t border-outline bg-surface-low/60 flex items-center gap-2"
        >
          <label htmlFor="advisor-message" className="sr-only">
            Ask the career advisor
          </label>
          <input
            id="advisor-message"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder={
              opportunities.length === 0
                ? "Add an opportunity in Parse Post first, or ask how CrestPath matches roles..."
                : "Ask about match fit, missing skills, or deadlines..."
            }
            className="flex-1 min-h-[44px] rounded-xl border border-outline bg-surface px-4 text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="min-h-[44px] px-4 rounded-[10px] bg-primary hover:opacity-90 disabled:opacity-45 text-white dark:text-[#04261D] text-sm font-semibold inline-flex items-center gap-1.5 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </section>
    </div>
  );
}
