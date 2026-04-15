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
      id: "pf-1",
      source: "petfinder-mock",
      sourceUrl: "https://www.petfinder.com/",
      name: "Nina",
      breed: "Podengo Portugues",
      isMix: true,
      age: "young",
      sex: "female",
      size: "small",
      photos: ["https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600"],
      description: "Sociavel, curiosa e habituada a apartamento.",
      goodWith: { children: true, dogs: true, cats: null },
      energyLevel: "medium",
      specialNeeds: false,
      shelter: {
        name: "Associacao Amiga Animal",
        address: `${city}`,
        lat: 41.15,
        lng: -8.61
      },
      available: true,
      listedAt: nowIso()
    },
    {
      id: "pf-2",
      source: "petfinder-mock",
      sourceUrl: "https://www.petfinder.com/",
      name: "Bolt",
      breed: "Mestico",
      isMix: true,
      age: "adult",
      sex: "male",
      size: "medium",
      photos: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600"],
      description: "Muito meigo e ideal para familias ativas.",
      goodWith: { children: true, dogs: true, cats: false },
      energyLevel: "high",
      specialNeeds: false,
      shelter: {
        name: "Canil Municipal",
        address: `${city}`,
        lat: 41.16,
        lng: -8.62
      },
      available: true,
      listedAt: nowIso()
    },
    {
      id: "pf-3",
      source: "petfinder-mock",
      sourceUrl: "https://www.petfinder.com/",
      name: "Lua",
      breed: "Serra da Estrela",
      isMix: false,
      age: "puppy",
      sex: "female",
      size: "small",
      photos: ["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600"],
      description: "Cachorra jovem, aprende rapido e adora brincar.",
      goodWith: { children: true, dogs: true, cats: true },
      energyLevel: "medium",
      specialNeeds: false,
      shelter: {
        name: "Refugio Patas Felizes",
        address: `${city}`,
        lat: 41.17,
        lng: -8.59
      },
      available: true,
      listedAt: nowIso()
    }
  ];

  return baseDogs;
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
