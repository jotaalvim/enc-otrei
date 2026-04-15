import { useMemo, useState } from "react";
import type {
  AdopterProfile,
  ChatMessage,
  ChatMode,
  Dog,
  DogTrainingProfile,
  TrainingPlan
} from "../../shared/src/types";
import { sendChat } from "./lib/api";
import { DogResults } from "./components/DogResults";
import { MessageList } from "./components/MessageList";
import { ModeSelector } from "./components/ModeSelector";
import { TrainingPlanView } from "./components/TrainingPlanView";

function emptyAdopterProfile(): AdopterProfile {
  return {
    collectedFields: [],
    lastUpdated: new Date().toISOString()
  };
}

function emptyTrainingProfile(): DogTrainingProfile {
  return {
    collectedFields: [],
    behaviorGoals: [],
    dailyRoutine: {},
    lastUpdated: new Date().toISOString()
  };
}

export function App() {
  const [mode, setMode] = useState<ChatMode>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Sou o DogFinder. Posso ajudar em adocao ou treino. Escolhe um modo e envia a tua mensagem."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | undefined>();
  const [adopterProfile, setAdopterProfile] = useState<AdopterProfile>(emptyAdopterProfile());
  const [dogTrainingProfile, setDogTrainingProfile] = useState<DogTrainingProfile>(
    emptyTrainingProfile()
  );

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await sendChat({
        messages: nextMessages,
        mode,
        adopterProfile,
        dogTrainingProfile
      });

      setMode(response.mode);
      setAdopterProfile(response.adopterProfile);
      setDogTrainingProfile(response.dogTrainingProfile);
      setDogs(response.dogs ?? []);
      setTrainingPlan(response.trainingPlan);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.assistantMessage
        }
      ]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function onModeChange(nextMode: Exclude<ChatMode, null>) {
    setMode(nextMode);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          nextMode === "adoption"
            ? "Modo adocao ativo. Diz-me a tua cidade para comecar a procurar caes."
            : "Modo treino ativo. Conta-me o nome do teu cao e principal objetivo de treino."
      }
    ]);
    setDogs([]);
    setTrainingPlan(undefined);
  }

  return (
    <main className="app-shell">
      <header className="header">
        <h1>DogFinder Agent</h1>
        <p>MVP conversacional para adocao e treino personalizado</p>
      </header>

      <ModeSelector mode={mode} onModeChange={onModeChange} />

      <MessageList messages={messages} />

      <form className="chat-form" onSubmit={onSubmit}>
        <input
          placeholder="Escreve aqui..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button type="submit" disabled={!canSend}>
          {loading ? "A processar..." : "Enviar"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <DogResults dogs={dogs} />
      <TrainingPlanView plan={trainingPlan} />
    </main>
  );
}
