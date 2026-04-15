# 🐾 DogFinder Agent — Plano de Desenvolvimento

## Visão Geral

**DogFinder Agent** é uma aplicação web conversacional com dois modos complementares:
- **Modo Adoção**: o agente guia o utilizador para encontrar cães reais disponíveis para adoção.
- **Modo Treino**: o agente ajuda quem já tem cão a criar e ajustar um plano de treino personalizado às características específicas desse cão.

O utilizador não preenche formulários — fala com o agente. O agente faz as perguntas certas, acumula contexto, pesquisa as fontes disponíveis (no modo adoção) e cria planos progressivos e adaptativos (no modo treino), refinando tudo com base no feedback do utilizador.

---

## Conceito Central: Agente Conversacional

```
Utilizador: "Quero adotar um cão mas não sei bem o quê"
Agente:     "Ótimo! Para te ajudar melhor — vives numa casa ou apartamento?"
Utilizador: "Apartamento, no Porto"
Agente:     "Tens crianças pequenas ou outros animais em casa?"
Utilizador: "Tenho uma filha de 4 anos"
Agente:     "Perfeito. Encontrei 3 cães perto de ti que combinam bem ↓"
            [apresenta cards com cães disponíveis para adoção]
Utilizador: "O segundo parece interessante mas preferia mais novo"
Agente:     "Entendido! A filtrar por cachorros e jovens adultos..."
            [atualiza resultados]
```

O agente mantém um **perfil do adotante** que vai construindo ao longo da conversa, e usa esse perfil para cada pesquisa.

No modo treino, o agente mantém também um **perfil do cão atual** e um **histórico de sessões de treino**, ajustando objetivos semanais consoante evolução, dificuldades e contexto familiar.

---

## Arquitetura do Agente

### Componentes Principais

```
┌─────────────────────────────────────────────────────┐
│                  DogFinder Agent                    │
│                                                     │
│  ┌─────────────┐    ┌──────────────────────────┐   │
│  │  Chat UI    │◄──►│   Claude (Agente LLM)    │   │
│  │             │    │                          │   │
│  │ • Mensagens │    │ • Perfil do adotante     │   │
│  │ • Dog cards │    │ • Lógica de perguntas    │   │
│  │ • Plano     │    │ • Decisão de pesquisar   │   │
│  │   treino    │    │ • Decisão de treinar     │   │
│  │ • Mapa      │    │ • Interpretação feedback │   │
│  └─────────────┘    │ • Interpretação feedback │   │
│                     └──────────┬─────────────┘    │
│                                │ tool calls         │
│                     ┌──────────▼─────────────┐    │
│                     │      Tools / APIs       │    │
│                     │                         │    │
│                     │  • search_dogs()        │    │
│                     │  • get_dog_details()    │    │
│                     │  • find_shelters()      │    │
│                     │  • get_location()       │    │
│                     │  • generate_training_   │    │
│                     │    plan()               │    │
│                     │  • log_training_        │    │
│                     │    session()            │    │
│                     │  • adapt_training_      │    │
│                     │    plan()               │    │
│                     └─────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Perfil do Adotante (estado acumulado)

O agente mantém e atualiza este objeto ao longo da conversa:

```typescript
interface AdopterProfile {
  // Contexto de vida
  location?: { city: string; lat: number; lng: number };
  housingType?: 'apartment' | 'house_no_garden' | 'house_with_garden';
  hasChildren?: boolean;
  childrenAges?: number[];
  hasOtherPets?: boolean;
  otherPetsType?: string[];

  // Preferências sobre o cão
  sizePreference?: 'small' | 'medium' | 'large' | 'any';
  agePreference?: 'puppy' | 'young' | 'adult' | 'senior' | 'any';
  energyLevel?: 'low' | 'medium' | 'high';
  breedPreference?: string[];
  sexPreference?: 'male' | 'female' | 'any';

  // Estilo de vida
  activityLevel?: 'sedentary' | 'moderate' | 'active';
  hoursAlonePerDay?: number;
  experienceWithDogs?: 'none' | 'some' | 'experienced';

  // Restrições
  allergies?: boolean;
  maxDistanceKm?: number;

  // Metadados
  collectedFields: string[];   // o que já foi perguntado
  lastUpdated: Date;
}
```

### Perfil do Cão Atual (modo treino)

```typescript
interface DogTrainingProfile {
  dogName?: string;
  ageMonths?: number;
  breed?: string;
  size?: 'small' | 'medium' | 'large';
  sex?: 'male' | 'female';
  neutered?: boolean;

  // Contexto comportamental
  behaviorGoals?: Array<
    | 'basic_obedience'
    | 'leash_walking'
    | 'recall'
    | 'socialization'
    | 'separation_anxiety'
    | 'reactivity'
    | 'house_training'
    | 'impulse_control'
  >;
  triggers?: string[];
  currentIssues?: string[];

  // Contexto de rotina
  dailyRoutine?: {
    walkMinutesPerDay?: number;
    playMinutesPerDay?: number;
    trainingMinutesPerDay?: number;
    hoursAlonePerDay?: number;
  };
  hasChildrenAtHome?: boolean;
  hasOtherPetsAtHome?: boolean;

  // Metadados
  collectedFields: string[];
  lastUpdated: Date;
}
```

---

## Tools do Agente

O agente Claude usa **function calling** para interagir com fontes externas:

### `search_dogs(params)`
Pesquisa animais disponíveis para adoção. Agrega resultados de múltiplas fontes.

```typescript
search_dogs({
  location: { lat: 41.14, lng: -8.61 },   // Porto
  radiusKm: 50,
  filters: {
    size: 'small',
    age: ['puppy', 'young'],
    goodWithChildren: true,
    goodWithCats: false
  },
  limit: 5
})
// → Dog[]
```

**Fontes integradas:**
| Fonte | Cobertura | Método |
|---|---|---|
| PetFinder API | Internacional (inclui PT) | API REST oficial |
| Adopta.pt | Portugal | Web scraping |
| Associação Zoofilia Lisboa | Local | Scraping |
| AAACÃO Porto | Local | Scraping |
| Canis municipais | Regional | Google Places + scraping |

### `get_dog_details(dogId, source)`
Obtém informação completa de um cão específico (fotos, descrição, contacto).

### `find_shelters(location, radiusKm)`
Lista canis e associações próximas do utilizador.

### `get_location(cityName)`
Converte nome de cidade em coordenadas (geocoding).

### `generate_training_plan(params)`
Gera plano de treino progressivo e seguro com base no perfil do cão, objetivos e restrições do tutor.

```typescript
generate_training_plan({
  dogProfile: {
    ageMonths: 18,
    size: 'medium',
    behaviorGoals: ['leash_walking', 'recall'],
    currentIssues: ['puxa muito na trela', 'ignora chamada em parques']
  },
  ownerConstraints: {
    minutesPerDay: 20,
    environment: 'urban_apartment'
  },
  horizonDays: 14
})
// -> TrainingPlan
```

### `log_training_session(session)`
Regista resultado de uma sessão (exercícios feitos, sucesso, dificuldades, contexto).

### `adapt_training_plan(progress)`
Atualiza o plano com base em progresso real do cão e feedback do tutor.

---

## Lógica do Agente

### Estratégia de Recolha de Informação

O agente **não faz todas as perguntas de uma vez**. A ordem e ritmo das perguntas é dinâmico:

1. **Perguntas de alto impacto primeiro** — localização, habitação, crianças/outros animais. Estas eliminam mais opções.
2. **Pesquisa logo que tiver informação suficiente** — não espera pelo perfil completo. Apresenta resultados cedo para manter o utilizador envolvido.
3. **Refina com feedback** — quando o utilizador reage a um resultado ("muito grande", "prefiro mais jovem"), atualiza o perfil e repesquisa.
4. **Não pergunta o que já sabe** — se o utilizador disse "apartamento no Porto", não pergunta a cidade.

### Estratégia de Treino Personalizado

No modo treino, o agente segue um ciclo iterativo:

1. **Definir objetivo concreto** — ex: "andar sem puxar", "vir quando chamado".
2. **Diagnóstico leve e seguro** — idade, contexto, gatilhos, duração possível por dia.
3. **Micro-plano executável** — sessões curtas (5-15 min), exercícios graduais e critérios de sucesso.
4. **Reforço positivo e bem-estar** — sem recomendar punição aversiva; foco em consistência e gestão do ambiente.
5. **Ajuste contínuo** — se não houver progresso, simplifica o exercício, altera contexto ou reduz critério.

Se o utilizador relatar sinais potencialmente clínicos (dor, agressividade grave, ansiedade extrema), o agente recomenda avaliação com veterinário e/ou treinador comportamental certificado.

### System Prompt do Agente

```
És o DogFinder, um assistente especializado em:
1) ajudar pessoas a encontrar o cão ideal para adotar em Portugal;
2) ajudar tutores a treinar o seu cão atual com planos personalizados e seguros.

O teu objetivo é guiar o utilizador numa conversa natural para perceber
se está em modo adoção ou modo treino, e depois:
- modo adoção: apresentar cães reais disponíveis para adoção;
- modo treino: criar e ajustar um plano de treino semanal, claro e aplicável.

Comportamento:
- Faz UMA pergunta de cada vez. Nunca bombardeies com muitas perguntas.
- Apresenta resultados assim que tiveres informação suficiente (localização +
  1-2 preferências básicas já chegam para uma primeira pesquisa).
- No modo treino, propõe exercícios curtos, progressivos e mensuráveis.
- Quando o utilizador reage a um resultado, extrai preferências implícitas.
  ("muito grande" → prefere pequeno/médio; "demasiado velho" → prefere jovem)
- Quando o utilizador descreve dificuldades de treino, extrai objetivos implícitos.
  ("puxa na rua" → treino de trela; "não vem" → recall básico)
- Sê caloroso, empático e conhecedor sobre cães.
- Quando apresentas cães, usa sempre o tool search_dogs com os parâmetros
  mais precisos possíveis dado o perfil atual.
- Quando criares treino, usa generate_training_plan e adapt_training_plan.
- Mantém o perfil do adotante e/ou do cão atualizado internamente.
- Nunca inventes cães de adoção — usa sempre dados reais dos tools.
- Nunca recomendes castigos físicos, dor, medo ou técnicas aversivas.

Perfil atual do adotante: {adopterProfile}
Perfil atual do cão (treino): {dogTrainingProfile}
```

---

## Stack Técnico

```
Frontend:     React + TypeScript + Tailwind CSS
LLM:          Claude claude-sonnet-4-20250514 (via Anthropic API)
Tool Runtime: Backend Node.js/Express — executa os tools em segurança
Scraping:     Playwright (headless browser para sites sem API)
Cache:        Redis — resultados de pesquisa com TTL 2h
Mapas:        Mapbox GL JS
Deploy:       Vercel (frontend) + Railway (backend + Redis)
```

---

## Estrutura do Projeto

```
dogfinder-agent/
├── frontend/
│   ├── components/
│   │   ├── ChatInterface/        # Janela de conversa principal
│   │   ├── DogCard/              # Card de apresentação de um cão
│   │   ├── DogCarousel/          # Carrossel de resultados no chat
│   │   ├── ShelterMap/           # Mapa com pins dos canis
│   │   ├── ProfileSummary/       # Sidebar com perfil do adotante
│   │   ├── TrainingPlanCard/     # Bloco com exercício e objetivo
│   │   └── TrainingProgress/     # Evolução semanal do treino
│   └── hooks/
│       ├── useAgent.ts           # Gestão do estado da conversa
│       ├── useAdopterProfile.ts  # Perfil acumulado (adoção)
│       └── useTrainingProfile.ts # Perfil acumulado (treino)
│
├── backend/
│   ├── agent/
│   │   ├── systemPrompt.ts       # Prompt do agente
│   │   ├── tools.ts              # Definição dos tools para o Claude
│   │   └── toolExecutor.ts       # Execução dos tools
│   ├── sources/
│   │   ├── petfinder.ts          # PetFinder API
│   │   ├── adoptapt.ts           # Scraper Adopta.pt
│   │   └── localShelters.ts      # Scraper canis locais
│   ├── training/
│   │   ├── planner.ts            # Geração de plano por objetivo
│   │   ├── progression.ts        # Regras de progressão/regressão
│   │   └── safety.ts             # Guardrails de treino ético
│   └── utils/
│       ├── normalizer.ts         # Formato comum para todos os animais
│       └── geocoder.ts           # Geocoding de cidades
│
└── shared/
  └── types.ts                  # Tipos partilhados (Dog, AdopterProfile, DogTrainingProfile, etc.)
```

---

## Modelo de Dados — Cão Normalizado

```typescript
interface Dog {
  id: string;
  source: string;           // 'petfinder' | 'adoptapt' | 'aaacao' | ...
  sourceUrl: string;        // Link para o perfil original
  name: string;
  breed: string;
  isMix: boolean;
  age: 'puppy' | 'young' | 'adult' | 'senior';
  ageMonths?: number;
  sex: 'male' | 'female';
  size: 'small' | 'medium' | 'large';
  photos: string[];
  description: string;
  goodWith: {
    children: boolean | null;
    dogs: boolean | null;
    cats: boolean | null;
  };
  energyLevel?: 'low' | 'medium' | 'high';
  specialNeeds: boolean;
  shelter: {
    name: string;
    address: string;
    phone?: string;
    lat: number;
    lng: number;
  };
  distanceKm?: number;      // calculado por pedido
  available: boolean;
  listedAt: Date;
}
```

## Modelo de Dados — Treino

```typescript
interface TrainingExercise {
  id: string;
  title: string;
  objective: string;
  steps: string[];
  durationMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  successCriteria: string;
  fallbackIfFail?: string;
}

interface TrainingPlan {
  id: string;
  dogProfileSnapshot: DogTrainingProfile;
  mainGoal: string;
  weekNumber: number;
  sessionsPerWeek: number;
  exercises: TrainingExercise[];
  notes: string[];
  generatedAt: Date;
}
```

---

## Fases de Desenvolvimento

### Fase 1 — Protótipo Conversacional (3 semanas)
- [ ] Interface de chat React
- [ ] Integração Claude API com system prompt base
- [ ] Tool `search_dogs` com PetFinder API
- [ ] Tool `get_location` (geocoding)
- [ ] Apresentação de DogCards dentro do chat
- [ ] Deploy MVP

### Fase 2 — Fontes Portuguesas (3 semanas)
- [ ] Scraper Adopta.pt com Playwright
- [ ] Scraper AAACÃO Porto
- [ ] Scraper Associação Zoofilia Lisboa
- [ ] Normalização e deduplicação de resultados
- [ ] Mapa de canis próximos

### Fase 3 — Inteligência do Agente (2 semanas)
- [ ] Extração implícita de preferências do feedback
- [ ] Refinamento do system prompt com exemplos few-shot
- [ ] Persistência do perfil do adotante entre sessões
- [ ] Sugestão proativa ("Novo cão adicionado que combina contigo!")

### Fase 4 — Polimento (2 semanas)
- [ ] Favoritos e comparação de cães
- [ ] Modo "Surpresa" — agente escolhe sem perguntar muito
- [ ] PWA para mobile
- [ ] Analytics de conversas (melhorar o agente)

### Fase 5 — Treino Personalizado (3 semanas)
- [ ] Modo de conversa "Já tenho cão"
- [ ] Perfil do cão atual (idade, raça, contexto, objetivos)
- [ ] Tool `generate_training_plan`
- [ ] Tool `log_training_session` + tracking de progresso
- [ ] Tool `adapt_training_plan` com ajustes automáticos
- [ ] Biblioteca inicial de exercícios por objetivo
- [ ] Guardrails de segurança (treino ético + alertas clínicos)

---

## Considerações

- **RGPD**: Localização do utilizador apenas usada para pesquisa, não armazenada sem consentimento.
- **Rate limits**: PetFinder API tem limites — usar cache Redis agressivo (TTL 2h).
- **Scraping ético**: Respeitar `robots.txt`; identificar o user-agent; não sobrecarregar os servidores das associações.
- **Dados desatualizados**: Sempre mostrar data de última atualização; link para fonte original.
- **Fallback**: Se um cão já foi adotado, informar o utilizador com graça e sugerir alternativas.
- **Treino responsável**: O agente não substitui veterinário nem treinador comportamental em casos graves.
- **Bem-estar animal**: Recomendações focadas em reforço positivo, sem técnicas aversivas.
- **Expectativas realistas**: Mostrar que progresso de treino é gradual e depende de consistência.

---

## Próximos Passos Imediatos

1. Criar chave Anthropic API (Claude) — https://console.anthropic.com
2. Registar na PetFinder API — https://www.petfinder.com/developers/
3. Criar chave Google Maps (geocoding) — https://console.cloud.google.com
4. Inicializar repo: `npx create-next-app dogfinder-agent --typescript`
5. Implementar o loop base: Chat UI → Claude API → tool call → resultado → Chat UI
6. Adicionar seleção de modo inicial: "Quero adotar" vs "Quero treinar o meu cão"
7. Implementar fluxo de treino: objetivo → plano semanal → registo de sessão → ajuste automático
