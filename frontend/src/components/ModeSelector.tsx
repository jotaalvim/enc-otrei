import type { ChatMode } from "../../../shared/src/types";

interface ModeSelectorProps {
  mode: ChatMode;
  onModeChange: (mode: Exclude<ChatMode, null>) => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector">
      <button
        className={mode === "adoption" ? "mode-btn active" : "mode-btn"}
        onClick={() => onModeChange("adoption")}
      >
        Quero adotar
      </button>
      <button
        className={mode === "training" ? "mode-btn active" : "mode-btn"}
        onClick={() => onModeChange("training")}
      >
        Quero treinar o meu cao
      </button>
    </div>
  );
}
