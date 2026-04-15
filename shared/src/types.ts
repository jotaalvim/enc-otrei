export type ChatMode = "adoption" | "training" | null;

export interface AdopterProfile {
  location?: { city: string; lat?: number; lng?: number };
  housingType?: "apartment" | "house_no_garden" | "house_with_garden";
  hasChildren?: boolean;
  childrenAges?: number[];
  hasOtherPets?: boolean;
  otherPetsType?: string[];
  sizePreference?: "small" | "medium" | "large" | "any";
  agePreference?: "puppy" | "young" | "adult" | "senior" | "any";
  energyLevel?: "low" | "medium" | "high";
  breedPreference?: string[];
  sexPreference?: "male" | "female" | "any";
  activityLevel?: "sedentary" | "moderate" | "active";
  hoursAlonePerDay?: number;
  experienceWithDogs?: "none" | "some" | "experienced";
  allergies?: boolean;
  maxDistanceKm?: number;
  collectedFields: string[];
  lastUpdated: string;
}

export interface DogTrainingProfile {
  dogName?: string;
  ageMonths?: number;
  breed?: string;
  size?: "small" | "medium" | "large";
  sex?: "male" | "female";
  neutered?: boolean;
  behaviorGoals?: Array<
    | "basic_obedience"
    | "leash_walking"
    | "recall"
    | "socialization"
    | "separation_anxiety"
    | "reactivity"
    | "house_training"
    | "impulse_control"
  >;
  triggers?: string[];
  currentIssues?: string[];
  dailyRoutine?: {
    walkMinutesPerDay?: number;
    playMinutesPerDay?: number;
    trainingMinutesPerDay?: number;
    hoursAlonePerDay?: number;
  };
  hasChildrenAtHome?: boolean;
  hasOtherPetsAtHome?: boolean;
  collectedFields: string[];
  lastUpdated: string;
}

export interface Dog {
  id: string;
  source: string;
  sourceUrl: string;
  name: string;
  breed: string;
  isMix: boolean;
  age: "puppy" | "young" | "adult" | "senior";
  ageMonths?: number;
  sex: "male" | "female";
  size: "small" | "medium" | "large";
  photos: string[];
  description: string;
  goodWith: {
    children: boolean | null;
    dogs: boolean | null;
    cats: boolean | null;
  };
  energyLevel?: "low" | "medium" | "high";
  specialNeeds: boolean;
  shelter: {
    name: string;
    address: string;
    phone?: string;
    lat: number;
    lng: number;
  };
  distanceKm?: number;
  available: boolean;
  listedAt: string;
}

export interface TrainingExercise {
  id: string;
  title: string;
  objective: string;
  steps: string[];
  durationMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  successCriteria: string;
  fallbackIfFail?: string;
}

export interface TrainingPlan {
  id: string;
  dogProfileSnapshot: DogTrainingProfile;
  mainGoal: string;
  weekNumber: number;
  sessionsPerWeek: number;
  exercises: TrainingExercise[];
  notes: string[];
  generatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  mode: ChatMode;
  adopterProfile?: AdopterProfile;
  dogTrainingProfile?: DogTrainingProfile;
}

export interface ChatResponse {
  assistantMessage: string;
  mode: ChatMode;
  adopterProfile: AdopterProfile;
  dogTrainingProfile: DogTrainingProfile;
  dogs?: Dog[];
  trainingPlan?: TrainingPlan;
}
