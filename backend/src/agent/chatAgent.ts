import type {
  AdopterProfile,
  ChatMode,
  ChatRequest,
  ChatResponse,
  DogTrainingProfile,
  TrainingPlan
} from "../../../shared/src/types.js";
import { adaptTrainingPlan, generateTrainingPlan, searchDogs } from "../tools/mockTools.js";

function nowIso(): string {
  return new Date().toISOString();
}

function defaultAdopterProfile(): AdopterProfile {
  return {
    collectedFields: [],
    lastUpdated: nowIso()
  };
}

function defaultTrainingProfile(): DogTrainingProfile {
  return {
    collectedFields: [],
    behaviorGoals: [],
    dailyRoutine: {},
    lastUpdated: nowIso()
  };
}

function detectMode(lastUserMessage: string): ChatMode {
  const text = lastUserMessage.toLowerCase();
  if (text.includes("treinar") || text.includes("treino") || text.includes("ja tenho")) {
    return "training";
  }
  if (text.includes("adotar") || text.includes("ado") || text.includes("cao")) {
    return "adoption";
  }
  return null;
}

function parseCity(message: string): string | undefined {
  const knownCities = ["porto", "lisboa", "braga", "coimbra", "faro", "aveiro"];
  const normalized = message.toLowerCase();
  const match = knownCities.find((city) => normalized.includes(city));
  if (!match) return undefined;
  return match.charAt(0).toUpperCase() + match.slice(1);
}

function parseHousingType(message: string): AdopterProfile["housingType"] {
  const text = message.toLowerCase();
  if (text.includes("apartamento")) return "apartment";
  if (text.includes("casa") && text.includes("jardim")) return "house_with_garden";
  if (text.includes("casa")) return "house_no_garden";
  return undefined;
}

function parseDogName(message: string): string | undefined {
  const m = message.match(/(?:chama[- ]?se|nome|e o|é o)\s+([a-zA-ZÀ-ÿ]+)/i);
  if (m?.[1]) return m[1];
  return undefined;
}

function parseAgeMonths(message: string): number | undefined {
  const text = message.toLowerCase();
  const years = text.match(/(\d+)\s*anos?/);
  if (years?.[1]) return Number(years[1]) * 12;
  const months = text.match(/(\d+)\s*mes(?:es)?/);
  if (months?.[1]) return Number(months[1]);
  return undefined;
}

function parseTrainingMinutes(message: string): number | undefined {
  const m = message.toLowerCase().match(/(\d+)\s*min/);
  if (m?.[1]) return Number(m[1]);
  return undefined;
}

function parseGoals(message: string): DogTrainingProfile["behaviorGoals"] {
  const text = message.toLowerCase();
  const goals = new Set<NonNullable<DogTrainingProfile["behaviorGoals"]>[number]>();

  if (text.includes("puxa") || text.includes("trela")) goals.add("leash_walking");
  if (text.includes("nao vem") || text.includes("não vem") || text.includes("cham") || text.includes("recall")) {
    goals.add("recall");
  }
  if (text.includes("social") || text.includes("caes") || text.includes("cães")) goals.add("socialization");
  if (text.includes("ansiedade") || text.includes("sozinho")) goals.add("separation_anxiety");

  return goals.size ? Array.from(goals) : undefined;
}

function handleAdoption(
  message: string,
  profile: AdopterProfile,
  mode: ChatMode
): ChatResponse {
  if (!mode) {
    return {
      assistantMessage: "Queres usar o modo adocao ou treino?",
      mode,
      adopterProfile: profile,
      dogTrainingProfile: defaultTrainingProfile()
    };
  }

  const city = parseCity(message);
  if (city && !profile.location?.city) {
    profile.location = { city };
    profile.collectedFields.push("location.city");
  }

  const housingType = parseHousingType(message);
  if (housingType && !profile.housingType) {
    profile.housingType = housingType;
    profile.collectedFields.push("housingType");
  }

  profile.lastUpdated = nowIso();

  if (!profile.location?.city) {
    return {
      assistantMessage: "Perfeito. Para comecar a pesquisa de adocao, em que cidade estas?",
      mode,
      adopterProfile: profile,
      dogTrainingProfile: defaultTrainingProfile()
    };
  }

  if (!profile.housingType) {
    return {
      assistantMessage: "Vives em apartamento, casa sem jardim ou casa com jardim?",
      mode,
      adopterProfile: profile,
      dogTrainingProfile: defaultTrainingProfile()
    };
  }

  const dogs = searchDogs(profile.location.city);
  return {
    assistantMessage: `Encontrei ${dogs.length} caes compativeis perto de ${profile.location.city}. Queres que refine por idade ou tamanho?`,
    mode,
    adopterProfile: profile,
    dogTrainingProfile: defaultTrainingProfile(),
    dogs
  };
}

function handleTraining(
  message: string,
  profile: DogTrainingProfile,
  mode: ChatMode
): ChatResponse {
  if (!mode) {
    return {
      assistantMessage: "Queres que te ajude em modo adocao ou modo treino?",
      mode,
      adopterProfile: defaultAdopterProfile(),
      dogTrainingProfile: profile
    };
  }

  const parsedName = parseDogName(message);
  if (parsedName && !profile.dogName) {
    profile.dogName = parsedName;
    profile.collectedFields.push("dogName");
  }

  const ageMonths = parseAgeMonths(message);
  if (ageMonths && !profile.ageMonths) {
    profile.ageMonths = ageMonths;
    profile.collectedFields.push("ageMonths");
  }

  const goals = parseGoals(message);
  if (goals?.length) {
    const merged = new Set([...(profile.behaviorGoals ?? []), ...goals]);
    profile.behaviorGoals = Array.from(merged);
    if (!profile.collectedFields.includes("behaviorGoals")) {
      profile.collectedFields.push("behaviorGoals");
    }
  }

  const trainingMinutes = parseTrainingMinutes(message);
  if (trainingMinutes && !profile.dailyRoutine?.trainingMinutesPerDay) {
    profile.dailyRoutine = {
      ...profile.dailyRoutine,
      trainingMinutesPerDay: trainingMinutes
    };
    profile.collectedFields.push("dailyRoutine.trainingMinutesPerDay");
  }

  profile.lastUpdated = nowIso();

  if (!profile.dogName) {
    return {
      assistantMessage: "Excelente, vamos ao treino. Como se chama o teu cao?",
      mode,
      adopterProfile: defaultAdopterProfile(),
      dogTrainingProfile: profile
    };
  }

  if (!profile.ageMonths) {
    return {
      assistantMessage: `Boa. E qual e a idade do ${profile.dogName}? (em meses ou anos)`,
      mode,
      adopterProfile: defaultAdopterProfile(),
      dogTrainingProfile: profile
    };
  }

  if (!profile.behaviorGoals?.length) {
    return {
      assistantMessage: "Qual e a principal dificuldade agora? Ex.: puxa na trela, nao vem quando chamado, ansiedade quando fica sozinho.",
      mode,
      adopterProfile: defaultAdopterProfile(),
      dogTrainingProfile: profile
    };
  }

  if (!profile.dailyRoutine?.trainingMinutesPerDay) {
    return {
      assistantMessage: "Quantos minutos por dia consegues dedicar ao treino?",
      mode,
      adopterProfile: defaultAdopterProfile(),
      dogTrainingProfile: profile
    };
  }

  const plan = generateTrainingPlan(profile);
  let adaptedPlan: TrainingPlan | undefined;
  if (message.toLowerCase().includes("dificil") || message.toLowerCase().includes("difícil")) {
    adaptedPlan = adaptTrainingPlan(plan, 0.4);
  }

  const finalPlan = adaptedPlan ?? plan;
  return {
    assistantMessage: `Perfeito. Criei um plano semanal para o ${profile.dogName}. Faz 5 sessoes curtas por semana e diz-me como corre para ajustar.`,
    mode,
    adopterProfile: defaultAdopterProfile(),
    dogTrainingProfile: profile,
    trainingPlan: finalPlan
  };
}

export function processChat(request: ChatRequest): ChatResponse {
  const messages = request.messages ?? [];
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const detectedMode = request.mode ?? detectMode(lastUserMessage);
  const adopterProfile = request.adopterProfile ?? defaultAdopterProfile();
  const trainingProfile = request.dogTrainingProfile ?? defaultTrainingProfile();

  if (!detectedMode) {
    return {
      assistantMessage: "Posso ajudar-te em dois modos: adocao ou treino. Qual preferes?",
      mode: null,
      adopterProfile,
      dogTrainingProfile: trainingProfile
    };
  }

  if (detectedMode === "adoption") {
    return handleAdoption(lastUserMessage, adopterProfile, detectedMode);
  }

  return handleTraining(lastUserMessage, trainingProfile, detectedMode);
}
