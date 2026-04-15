# 🐾 DogFinder Agent — Plano de Desenvolvimento

## Visão Geral

**DogFinder Agent** é uma aplicação web conversacional onde um agente de IA guia o utilizador através de uma conversa natural para perceber o que procura num cão, e vai progressivamente pesquisando e apresentando animais disponíveis para adoção em sites de associações e canis.

O utilizador não preenche formulários — fala com o agente. O agente faz as perguntas certas, acumula contexto, pesquisa as fontes disponíveis e devolve resultados relevantes, refinando com o feedback do utilizador.

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
│  │ • Mapa      │    │ • Decisão de pesquisar   │   │
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

---

## Lógica do Agente

### Estratégia de Recolha de Informação

O agente **não faz todas as perguntas de uma vez**. A ordem e ritmo das perguntas é dinâmico:

1. **Perguntas de alto impacto primeiro** — localização, habitação, crianças/outros animais. Estas eliminam mais opções.
2. **Pesquisa logo que tiver informação suficiente** — não espera pelo perfil completo. Apresenta resultados cedo para manter o utilizador envolvido.
3. **Refina com feedback** — quando o utilizador reage a um resultado ("muito grande", "prefiro mais jovem"), atualiza o perfil e repesquisa.
4. **Não pergunta o que já sabe** — se o utilizador disse "apartamento no Porto", não pergunta a cidade.

### System Prompt do Agente

```
És o DogFinder, um assistente especializado em ajudar pessoas a encontrar
o cão ideal para adotar em Portugal.

O teu objetivo é guiar o utilizador numa conversa natural para perceber
o que procura, e apresentar cães reais disponíveis para adoção.

Comportamento:
- Faz UMA pergunta de cada vez. Nunca bombardeies com muitas perguntas.
- Apresenta resultados assim que tiveres informação suficiente (localização +
  1-2 preferências básicas já chegam para uma primeira pesquisa).
- Quando o utilizador reage a um resultado, extrai preferências implícitas.
  ("muito grande" → prefere pequeno/médio; "demasiado velho" → prefere jovem)
- Sê caloroso, empático e conhecedor sobre cães.
- Quando apresentas cães, usa sempre o tool search_dogs com os parâmetros
  mais precisos possíveis dado o perfil atual.
- Mantém o perfil do adotante atualizado internamente.
- Nunca inventes cães — usa sempre dados reais dos tools.

Perfil atual do adotante: {adopterProfile}
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
│   │   └── ProfileSummary/       # Sidebar com perfil do adotante
│   └── hooks/
│       ├── useAgent.ts           # Gestão do estado da conversa
│       └── useAdopterProfile.ts  # Perfil acumulado
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
│   └── utils/
│       ├── normalizer.ts         # Formato comum para todos os animais
│       └── geocoder.ts           # Geocoding de cidades
│
└── shared/
    └── types.ts                  # Tipos partilhados (Dog, AdopterProfile, etc.)
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

---

## Considerações

- **RGPD**: Localização do utilizador apenas usada para pesquisa, não armazenada sem consentimento.
- **Rate limits**: PetFinder API tem limites — usar cache Redis agressivo (TTL 2h).
- **Scraping ético**: Respeitar `robots.txt`; identificar o user-agent; não sobrecarregar os servidores das associações.
- **Dados desatualizados**: Sempre mostrar data de última atualização; link para fonte original.
- **Fallback**: Se um cão já foi adotado, informar o utilizador com graça e sugerir alternativas.

---

## Próximos Passos Imediatos

1. Criar chave Anthropic API (Claude) — https://console.anthropic.com
2. Registar na PetFinder API — https://www.petfinder.com/developers/
3. Criar chave Google Maps (geocoding) — https://console.cloud.google.com
4. Inicializar repo: `npx create-next-app dogfinder-agent --typescript`
5. Implementar o loop base: Chat UI → Claude API → tool call → resultado → Chat UI
