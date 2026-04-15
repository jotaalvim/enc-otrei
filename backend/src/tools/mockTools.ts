import type {
  Dog,
  DogTrainingProfile,
  TrainingPlan,
  TrainingExercise
} from "../../../shared/src/types.js";

function nowIso(): string {
  return new Date().toISOString();
}

export function searchDogs(city: string): Dog[] {
  const baseDogs: Dog[] = [
    {
      id: "adopta-petal-4a3b67433a6944",
      source: "adopta-me",
      sourceUrl: "https://www.adopta-me.org/animal.php?sid=4a3b67433a6944",
      name: "Petal",
      breed: "Rafeiro Comum",
      isMix: true,
      age: "adult",
      sex: "female",
      size: "large",
      photos: ["https://www.adopta-me.org/media/image/40409694-Petal.jpeg"],
      description:
        "Cadela meiga e sociavel. Perfil publicado no Adopta-me por associacao de Setubal.",
      goodWith: { children: true, dogs: true, cats: null },
      energyLevel: "medium",
      specialNeeds: false,
      shelter: {
        name: "O Cantinho da Milu",
        address: "Setubal",
        lat: 38.5244,
        lng: -8.8882
      },
      available: true,
      listedAt: nowIso()
    },
    {
      id: "adopta-nelly-2a70467e6f487e",
      source: "adopta-me",
      sourceUrl: "https://www.adopta-me.org/animal.php?sid=2a70467e6f487e",
      name: "Nelly",
      breed: "Rafeiro Comum",
      isMix: true,
      age: "adult",
      sex: "female",
      size: "large",
      photos: ["https://www.adopta-me.org/media/image/47238561-nelly.jpeg"],
      description:
        "Cadela adulta e equilibrada, com perfil real no Adopta-me e contacto para adocao em Setubal.",
      goodWith: { children: true, dogs: true, cats: null },
      energyLevel: "medium",
      specialNeeds: false,
      shelter: {
        name: "O Cantinho da Milu",
        address: "Setubal",
        lat: 38.5244,
        lng: -8.8882
      },
      available: true,
      listedAt: nowIso()
    },
    {
      id: "adopta-luke-33532a76522f21",
      source: "adopta-me",
      sourceUrl: "https://www.adopta-me.org/animal.php?sid=33532a76522f21",
      name: "Luke",
      breed: "Rafeiro Comum",
      isMix: false,
      age: "young",
      sex: "male",
      size: "medium",
      photos: ["https://www.adopta-me.org/media/image/36522054-Luke.jpeg"],
      description:
        "Cao jovem e sociavel com outros caes. Perfil real no Adopta-me com mais informacao de adocao.",
      goodWith: { children: true, dogs: true, cats: null },
      energyLevel: "high",
      specialNeeds: false,
      shelter: {
        name: "O Cantinho da Milu",
        address: "Setubal",
        lat: 38.5244,
        lng: -8.8882
      },
      available: true,
      listedAt: nowIso()
    }
  ];

  // Enquanto o scraper portugues nao estiver ativo, devolvemos um conjunto base
  // de perfis reais do Adopta-me para manter foto/link consistentes.
  return baseDogs.map((dog) => ({
    ...dog,
    distanceKm: city.toLowerCase() === "setubal" ? 5 : 45
  }));
}

export function generateTrainingPlan(dogProfile: DogTrainingProfile): TrainingPlan {
  const leashExercise = {
    id: "ex-leash-1",
    title: "Trela relaxada em 5 metros",
    objective: "Reduzir puxoes e aumentar foco no tutor",
    steps: [
      "Comeca em ambiente calmo sem distracoes.",
      "Marca e recompensa quando a trela fica folgada por 2-3 segundos.",
      "Para imediatamente quando puxar e retoma apenas com trela relaxada.",
      "Repete em blocos de 3 minutos com pausas curtas."
    ],
    durationMinutes: 10,
    difficulty: "easy" as const,
    successCriteria: "80% do percurso com trela folgada",
    fallbackIfFail: "Reduzir distancia e regressar a ambiente menos estimulante"
  };

  const recallExercise = {
    id: "ex-recall-1",
    title: "Recall com reforco alto valor",
    objective: "Melhorar resposta ao nome e chamada",
    steps: [
      "Usa linha longa em zona segura.",
      "Chama o nome uma vez e recompensa imediatamente quando regressa.",
      "Aumenta gradualmente a distancia.",
      "Termina sempre com uma repeticao facil e bem sucedida."
    ],
    durationMinutes: 8,
    difficulty: "easy" as const,
    successCriteria: "Resposta em menos de 2 segundos em 7/10 tentativas",
    fallbackIfFail: "Diminuir distancia e usar recompensa mais motivadora"
  };

  const goals = dogProfile.behaviorGoals ?? [];
  const exercises = [];

  if (goals.includes("leash_walking") || goals.length === 0) {
    exercises.push(leashExercise);
  }
  if (goals.includes("recall") || goals.length === 0) {
    exercises.push(recallExercise);
  }

  return {
    id: `plan-${Date.now()}`,
    dogProfileSnapshot: dogProfile,
    mainGoal: goals[0] ?? "basic_obedience",
    weekNumber: 1,
    sessionsPerWeek: 5,
    exercises,
    notes: [
      "Sessões curtas e consistentes funcionam melhor do que sessões longas.",
      "Se houver sinais de dor, interromper e contactar veterinario.",
      "Usar reforco positivo e progressao gradual."
    ],
    generatedAt: nowIso()
  };
}

export function adaptTrainingPlan(currentPlan: TrainingPlan, successRate: number): TrainingPlan {
  const harden = successRate > 0.75;
  const nextDifficulty: TrainingExercise["difficulty"] = harden ? "medium" : "easy";
  const softenedExercises = currentPlan.exercises.map((exercise: TrainingExercise) => ({
    ...exercise,
    difficulty: nextDifficulty,
    durationMinutes: harden ? exercise.durationMinutes + 2 : Math.max(5, exercise.durationMinutes - 2)
  }));

  return {
    ...currentPlan,
    exercises: softenedExercises,
    notes: [
      ...currentPlan.notes,
      harden
        ? "Bom progresso: aumentar ligeiramente distracoes na proxima semana."
        : "Progresso irregular: simplificar contexto e subir criterio de forma mais lenta."
    ],
    generatedAt: nowIso()
  };
}
