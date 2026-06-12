import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a professional day trading assistant specialized in scalping and momentum trading. You help traders identify setups, analyze pre-market conditions, and manage risk.

You are knowledgeable about:
- Opening Range Breakout (ORB), VWAP bounces, bull/bear flags, gap and go setups
- Low float stocks and momentum plays
- Pre-market scanners (Finviz, Trade Ideas)
- Risk management and position sizing
- TD Ameritrade / thinkorswim platform
- Mountain Time zone trading (market opens 7:30 AM MT)

Keep responses concise, actionable, and formatted for traders. Use bullet points. Be direct. When discussing specific trades, always mention risk management. Never give specific buy/sell recommendations for specific stocks as financial advice — frame everything as educational setups to watch.`;

const QUICK_PROMPTS = [
  { label: "Gap & Go Setup", prompt: "Walk me through how to trade a gap and go setup tomorrow morning. What do I look for at open?" },
  { label: "VWAP Bounce", prompt: "How do I identify and enter a VWAP bounce trade? What confirms the setup?" },
  { label: "Risk Management", prompt: "I have a $5,000 account. How should I size my positions for scalping?" },
  { label: "Pre-Market Checklist", prompt: "Give me a pre-market checklist I should run through before the 7:30 AM MT open." },
  { label: "ORB Strategy", prompt: "Explain the Opening Range Breakout for the first 15 minutes. How do I set my levels?" },
  { label: "Low Float Scan", prompt: "What Finviz filters should I set tonight to find low float gappers for tomorrow?" },
];

const TICKER_TAPE = ["SPY", "QQQ", "NVDA", "TSLA", "AMD", "AMZN", "AAPL", "META", "MSFT", "SQQQ", "TQQQ", "SCHD"];

function TickerTape() {
  return (
    <div style={{ overflow: "hidden", background: "#0a0f1a", borderBottom: "1px solid #1e2d4a", padding: "6px 0" }}>
      <div style={{
        display: "flex", gap: "40px", animation: "scroll 20s linear infinite",
        whiteSpace: "nowrap"
      }}>
        {[...TICKER_TAPE, ...TICKER_TAPE].map((t, i) => (
          <span key={i} style={{ color: "#4ade80", fontFamily: "monospace", fontSize: "11px", letterSpacing: "1px" }}>
            {t} <span style={{ color: "#64748b" }}>▲</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "16px", gap: "10px", alignItems: "flex-start"
    }}>
      {!isUser && (
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
          background: "linear-gradient(135deg, #1e3a5f, #0ea5e9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "14px", fontWeight: "bold", color: "#fff", fontFamily: "monospace"
        }}>AI</div>
      )}
      <div style={{
        maxWidth: "80%", padding: "12px 16px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
        background: isUser ? "linear-gradient(135deg, #1e3a5f, #0ea5e9)" : "#0f1923",
        border: isUser ? "none" : "1px solid #1e2d4a",
        color: "#e2e8f0", fontSize: "14px", lineHeight: "1.6",
        fontFamily: "'Inter', sans-serif"
      }}>
        {msg.loading ? (
          <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: "6px", height: "6px", borderRadius: "50%", background: "#0ea5e9",
                animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`
              }} />
            ))}
            <style>{`@keyframes bounce { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
          </div>
        ) : (
          <FormattedMessage text={msg.content} />
        )}
      </div>
      {isUser && (
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
          background: "#1e3a5f", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "12px", color: "#94a3b8", fontFamily: "monospace"
        }}>YOU</div>
      )}
    </div>
  );
}

function FormattedMessage({ text }) {
  const lines = text.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <div key={i} style={{ fontWeight: "700", color: "#38bdf8", marginTop: i > 0 ? "10px" : 0, marginBottom: "4px" }}>{line.replace(/\*\*/g, "")}</div>;
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "3px" }}>
              <span style={{ color: "#0ea5e9", marginTop: "1px" }}>▸</span>
              <span>{line.replace(/^[-•] /, "").replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</span>
            </div>
          );
        }
        if (/^\d+\./.test(line)) {
          return (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "3px" }}>
              <span style={{ color: "#0ea5e9", minWidth: "18px", fontWeight: "600" }}>{line.match(/^\d+/)[0]}.</span>
              <span>{line.replace(/^\d+\.\s*/, "")}</span>
            </div>
          );
        }
        if (line.trim() === "") return <div key={i} style={{ height: "6px" }} />;
        return <div key={i} style={{ marginBottom: "2px" }}>{line.replace(/\*\*(.*?)\*\*/g, (_, m) => m)}</div>;
      })}
    </div>
  );
}

function MarketClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const mt = new Date(time.toLocaleString("en-US", { timeZone: "America/Denver" }));
  const h = mt.getHours(), m = mt.getMinutes();
  const marketOpen = h >= 7 && h < 14;
  const preMarket = (h === 6 && m >= 0) || (h === 7 && m < 30);
  const timeStr = mt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const status = preMarket ? { label: "PRE-MARKET", color: "#f59e0b" }
    : marketOpen ? { label: "MARKET OPEN", color: "#4ade80" }
    : { label: "AFTER HOURS", color: "#64748b" };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div>
        <div style={{ color: "#94a3b8", fontSize: "10px", letterSpacing: "1px", marginBottom: "2px" }}>MOUNTAIN TIME</div>
        <div style={{ color: "#e2e8f0", fontFamily: "monospace", fontSize: "16px", fontWeight: "700", letterSpacing: "1px" }}>{timeStr}</div>
      </div>
      <div style={{
        padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700",
        letterSpacing: "1px", color: status.color, border: `1px solid ${status.color}`,
        background: `${status.color}15`
      }}>{status.label}</div>
    </div>
  );
}

export default function TradingTool() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "**Good morning, trader.**\n\nI'm your AI pre-market assistant. I can help you:\n\n- Build your pre-market watchlist and game plan\n- Identify chart setups (ORB, VWAP, flags, gap & go)\n- Size positions for your account\n- Run through your thinkorswim scanner settings\n\nWhat are you working on today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages([...newMessages, { role: "assistant", content: "", loading: true }]);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response. Try again.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error. Check your network and try again." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div style={{
      minHeight: "100vh", background: "#060d18",
      fontFamily: "'Inter', -apple-system, sans-serif", display: "flex", flexDirection: "column"
    }}>
      <div style={{ background: "#0a0f1a", borderBottom: "1px solid #1e2d4a", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: "linear-gradient(135deg, #1e3a5f, #0ea5e9)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ fontSize: "18px" }}>📈</span>
          </div>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: "700", fontSize: "16px", letterSpacing: "0.5px" }}>PreMarket AI</div>
            <div style={{ color: "#64748b", fontSize: "11px", letterSpacing: "1px" }}>TRADING ASSISTANT</div>
          </div>
        </div>
        <MarketClock />
      </div>

      <TickerTape />

      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e2d4a", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {QUICK_PROMPTS.map((qp, i) => (
          <button key={i} onClick={() => sendMessage(qp.prompt)} disabled={loading}
            style={{
              padding: "6px 14px", borderRadius: "20px", border: "1px solid #1e3a5f",
              background: "#0a0f1a", color: "#94a3b8", fontSize: "12px", cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.15s", letterSpacing: "0.3px"
            }}
            onMouseEnter={e => { e.target.style.borderColor = "#0ea5e9"; e.target.style.color = "#38bdf8"; }}
            onMouseLeave={e => { e.target.style.borderColor = "#1e3a5f"; e.target.style.color = "#94a3b8"; }}
          >{qp.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px", maxWidth: "860px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: "1px solid #1e2d4a", padding: "16px 20px", background: "#0a0f1a" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about setups, scanners, risk sizing, thinkorswim config..."
            rows={1}
            style={{
              flex: 1, background: "#0f1923", border: "1px solid #1e2d4a", borderRadius: "12px",
              padding: "12px 16px", color: "#e2e8f0", fontSize: "14px", fontFamily: "inherit",
              resize: "none", outline: "none", lineHeight: "1.5", transition: "border-color 0.15s"
            }}
            onFocus={e => e.target.style.borderColor = "#0ea5e9"}
            onBlur={e => e.target.style.borderColor = "#1e2d4a"}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{
              width: "44px", height: "44px", borderRadius: "12px", border: "none",
              background: loading || !input.trim() ? "#1e2d4a" : "linear-gradient(135deg, #1e3a5f, #0ea5e9)",
              color: loading || !input.trim() ? "#64748b" : "#fff",
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", flexShrink: 0
            }}
          >▲</button>
        </div>
        <div style={{ maxWidth: "860px", margin: "8px auto 0", color: "#334155", fontSize: "11px", textAlign: "center" }}>
          For educational purposes only — not financial advice. Always manage your risk.
        </div>
      </div>
    </div>
  );
}