import {
  Activity,
  BrainCircuit,
  Code2,
  FileSearch,
  Globe2,
  Image,
  Mic2,
  Sparkles,
  Zap,
} from "lucide-react";

const capabilities = [
  { label: "Natural Conversation", icon: Sparkles },
  { label: "Reasoning & Planning", icon: BrainCircuit },
  { label: "Code & Debugging", icon: Code2 },
  { label: "Document Analysis", icon: FileSearch },
  { label: "Web Research", icon: Globe2 },
  { label: "Vision & Screen", icon: Image },
];

export default function ChatIntelligencePanel({
  isThinking = false,
  voiceMode = false,
  messageCount = 0,
}) {
  const status = isThinking
    ? "THINKING"
    : voiceMode
      ? "VOICE ACTIVE"
      : "ONLINE";

  return (
    <aside className="nyxora-intelligence-panel hidden xl:flex">
      <div className="nyxora-intelligence-panel__line" />

      <section className="nyxora-intel-card nyxora-intel-status">
        <div className="nyxora-intel-eyebrow">
          <Activity size={13} />
          SYSTEM STATUS
        </div>

        <div className="nyxora-intel-status-row">
          <span className={`nyxora-status-orb ${isThinking ? "is-thinking" : ""}`} />
          <span>{status}</span>
        </div>

        <p>
          {isThinking
            ? "Nyxora is processing your request."
            : voiceMode
              ? "Continuous voice conversation is active."
              : "Nyxora is ready for your next command."}
        </p>
      </section>

      <section className="nyxora-intel-card">
        <div className="nyxora-intel-eyebrow">
          <Zap size={13} />
          CAPABILITIES
        </div>

        <div className="nyxora-capability-list">
          {capabilities.map(({ label, icon: Icon }) => (
            <div key={label} className="nyxora-capability">
              <span className="nyxora-capability-icon">
                <Icon size={14} />
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="nyxora-intel-card nyxora-intel-quote">
        <div className="nyxora-quote-orbit">
          <div className="nyxora-quote-core">N</div>
        </div>
        <p>"Think. Create. Solve. Evolve."</p>
        <span>— NYXORA AI</span>
      </section>

      <section className="nyxora-intel-card nyxora-intel-session">
        <div>
          <span className="nyxora-intel-eyebrow">SESSION</span>
          <strong>{messageCount}</strong>
          <small>messages in this conversation</small>
        </div>
        <Mic2 size={18} />
      </section>
    </aside>
  );
}
