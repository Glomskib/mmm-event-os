"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bike } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function MilesChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages([...updated, { role: "assistant", content: data.reply }]);
      } else {
        setMessages([
          ...updated,
          {
            role: "assistant",
            content:
              data.error || "Sorry, I hit a bump in the road. Try again!",
          },
        ]);
      }
    } catch {
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: "Network error — check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
        aria-label={open ? "Close chat" : "Chat with Miles"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:w-[400px]">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ backgroundColor: "var(--brand-navy)" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--brand-orange)" }}
            >
              <Bike className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Miles</p>
              <p className="text-xs text-white/60">MMM Assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bike
                  className="mb-3 h-10 w-10"
                  style={{ color: "var(--brand-orange)" }}
                />
                <p className="text-sm font-medium text-foreground">
                  Hey there! I&apos;m Miles.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask me about rides, events, registration, or anything MMM!
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {[
                    "What rides are this week?",
                    "How do I register?",
                    "What is HHH?",
                    "Tell me about the referral program",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInput(q);
                        setTimeout(() => {
                          const fakeEvent = { preventDefault: () => {} };
                          void fakeEvent;
                          setInput("");
                          const userMsg: Message = { role: "user", content: q };
                          setMessages([userMsg]);
                          setLoading(true);
                          fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ messages: [userMsg] }),
                          })
                            .then((r) => r.json())
                            .then((data) => {
                              setMessages([
                                userMsg,
                                {
                                  role: "assistant",
                                  content: data.reply || "Sorry, try again!",
                                },
                              ]);
                            })
                            .catch(() => {
                              setMessages([
                                userMsg,
                                {
                                  role: "assistant",
                                  content: "Network error — try again.",
                                },
                              ]);
                            })
                            .finally(() => setLoading(false));
                        }, 0);
                      }}
                      className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl bg-muted px-4 py-3 rounded-bl-md">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Miles anything..."
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
