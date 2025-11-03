import React, { useContext, useEffect, useRef, useState } from "react";
import leadContext from "../context/leadContext";
import axios from "axios";

export default function TaxStewart() {
  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get("/ts-status", { withCredentials: true });
        if (r.data?.ok) {
          // hydrate the local UI count
          setQuestionCount(r.data.count ?? 0);

          // if already at limit, jump straight to contact phase + prompt
          if ((r.data.remaining ?? 3) <= 0) {
            push(
              "assistant",
              "You’ve reached today’s question limit. Please reply with your **email** (required) and optionally a **phone number** if you’d like a free consultation. Example: `me@example.com 555-123-4567`"
            );
            setPhase("askContact");
          }
        }
      } catch (e) {
        // optional: log or ignore
        console.error("ts-status failed", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { askTaxQuestion, sendQuestion } = useContext(leadContext);
  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const cleanPhone = (s) => (s || "").replace(/[^\d]/g, "").slice(0, 15);
  const parseContact = (input) => {
    const emailMatch = input.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
    const phoneMatch = input.replace(/[^\d]/g, "").match(/\d{7,15}/); // 7-15 digits
    return {
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
    };
  };
  // turn messages into a plaintext transcript
  const toTranscript = (msgs) =>
    msgs
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => (m.role === "user" ? "You: " : "Tax Stewart: ") + m.content)
      .join("\n\n");

  const [messages, setMessages] = useState([
    {
      id: "sys-hello",
      role: "assistant",
      content:
        "Hi my name is Stewart and I'm a tax expert! Ask me a U.S. tax question and I’ll give a short educational answer. You’ll have 3 questions, then I can connect you with a tax professional by email. Keep in mind my information was last updated in June of 2024, so if you'd like get more current information or have an urgent question, please type 'Ask EA'.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // phases: "chat" → "askEmail" → "collectNextQuestion" → "done"
  const [phase, setPhase] = useState("chat");
  const [questionCount, setQuestionCount] = useState(0);
  const [capturedEmail, setCapturedEmail] = useState("");
  const [capturedPhone, setCapturedPhone] = useState("");

  const bottomRef = useRef(null);
  useEffect(
    () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
    [messages, loading]
  );

  const push = (role, content) =>
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, content }]);

  const sendMessage = async (e) => {
    e?.preventDefault?.();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Always show user's entry
    push("user", trimmed);
    setInput("");
    if (/^\s*ask\s*ea\s*$/i.test(trimmed)) {
      // don't call backend, don't increment question count
      push(
        "assistant",
        "Okay—please share your **email** (required) and optional **phone** for a free consultation. Example: `me@example.com 555-123-4567`"
      );
      setPhase("askContact");
      return; // << important
    }
    // Phase machine
    if (phase === "chat") {
      setLoading(true);

      // Ask backend
      const res = await askTaxQuestion(trimmed);

      if (res?.ok && res?.answer) {
        push("assistant", res.answer);
      } else if (res?.blocked) {
        // if your backend enforces limits and returns blocked
        push(
          "assistant",
          res.answer || "You’ve reached today’s question limit."
        );
        setPhase("askContact");
        setLoading(false);
        return;
      } else {
        push("assistant", "Sorry, I couldn’t get an answer right now.");
      }

      // Increment question count AFTER getting the answer
      const nextCount = questionCount + 1;
      setQuestionCount(nextCount);
      setLoading(false);

      // If that was the 3rd answer, move to contact handoff
      if (nextCount >= 3) {
        push(
          "assistant",
          "It looks like you may need more in-depth guidance. Good news—Wynn Tax Solutions offers **Ask a Tax Professional**. " +
            "Please reply with your **email** (required) and optionally a **phone number** if you’d like a free consultation. " +
            "Example: `me@example.com 555-123-4567`"
        );
        setPhase("askContact");
      }
      return;
    } else if (phase === "askContact") {
      const { email, phone } = parseContact(trimmed);

      if (!isEmail(email)) {
        push(
          "assistant",
          "I didn’t see a valid email. Please reply with your **email** (required) and optionally a **phone number**. " +
            "Example: `me@example.com 555-123-4567`"
        );
        return;
      }

      setCapturedEmail(email);
      setCapturedPhone(cleanPhone(phone)); // may be empty — that’s fine

      push(
        "assistant",
        "Thanks! What’s the **next question** you want a tax professional to address? I’ll include it with your transcript."
      );
      setPhase("collectNextQuestion");
      return;
    } else if (phase === "collectNextQuestion") {
      // We have contact info; now collect the question for a tax professional and send via backend
      const transcript = toTranscript(messages); // includes the 3 Q&A already
      const nextQuestionForTP = trimmed;

      // Send to /send-question
      const payload = {
        name: "Tax Steward Lead",
        email: capturedEmail,
        phone: capturedPhone,
        message: {
          nextQuestion: nextQuestionForTP,
          transcript,
        },
      };

      setLoading(true);
      try {
        await sendQuestion(payload);
        push(
          "assistant",
          "All set! I sent your conversation and next question to a tax professional at Wynn Tax Solutions. " +
            "Watch your inbox for a follow-up. If you shared a phone number, we may reach out to offer a free consultation."
        );
        setPhase("done");
      } catch (err) {
        push(
          "assistant",
          "Hmm—something went wrong sending the message. Please try again or use the Contact page."
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    if (phase === "done") {
      // Optional: still allow more questions in chat, or gently nudge to wait for professional follow-up
      push(
        "assistant",
        "Thanks! A tax professional will be in touch by email. You can still ask quick educational questions here, but for case-specific guidance, watch your inbox."
      );
    }
  };

  return (
    <div style={styles.shell}>
      <div style={styles.chatContainer}>
        <div style={styles.chat}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                ...styles.msg,
                ...(m.role === "user" ? styles.user : styles.bot),
              }}
            >
              <div style={styles.role}>
                {m.role === "user" ? "You" : "Tax Stewart"}
              </div>
              <div style={styles.bubble}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.msg, ...styles.bot }}>
              <div style={styles.bubble}>Thinking…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} style={styles.inputRow}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              phase === "askContact"
                ? "Enter your email (required) and optional phone…"
                : phase === "collectNextQuestion"
                ? "Type the next question for a tax professional…"
                : "Type your tax question…"
            }
            style={styles.input}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              ...styles.button,
              ...(loading || !input.trim() ? styles.buttonDisabled : {}),
            }}
            onMouseEnter={(e) =>
              Object.assign(e.currentTarget.style, styles.buttonHover)
            }
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, styles.button)
            }
          >
            {phase === "askContact"
              ? "Send Contact"
              : phase === "collectNextQuestion"
              ? "Send Question"
              : "Send"}
          </button>
        </form>
      </div>

      <div style={styles.footerNote}>Questions used: {questionCount} / 3</div>
    </div>
  );
}

const styles = {
  shell: {
    maxWidth: 720,
    padding: "24px 20px",
    fontFamily: "system-ui, sans-serif",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    height: "calc(68vh - 48px)",
    boxSizing: "border-box", // keeps it tall but not overflowing viewport
  },

  chatContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    marginTop: 12,
    maxWidth: 720, // <— match shell’s content width
    alignSelf: "stretch", // <— force full stretch in flex parent
    boxSizing: "border-box",
  },
  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",

    maxWidth: 720, // <— ensure full width
    boxSizing: "border-box",

    scrollbarGutter: "stable both-edges",
  },
  msg: { display: "flex", flexDirection: "column" },
  user: { alignItems: "flex-end" },
  bot: { alignItems: "flex-start" },
  role: { fontSize: 12, color: "#888", marginBottom: 2 },
  bubble: {
    borderRadius: 12,
    padding: "10px 14px",
    maxWidth: "85%",
    backgroundColor: "#f3f4f6",
  },
  inputRow: {
    position: "sticky",
    bottom: 0,
    zIndex: 1,
    background: "#fff",
    display: "flex",
    gap: 8,
    borderTop: "1px solid #eee",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 15,
  },
  button: {
    background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(37,99,235,0.3)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  buttonHover: {
    transform: "translateY(-1px)",
    boxShadow: "0 6px 14px rgba(37,99,235,0.4)",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  footerNote: {
    marginTop: 12,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
};
