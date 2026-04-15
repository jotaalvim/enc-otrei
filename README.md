# enc-otrei

Plano de produto para o DogFinder Agent, uma app conversacional com dois modos:
- adoção de cães com pesquisa em fontes reais;
- treino personalizado para quem já tem cão, com planos progressivos e adaptativos.

Detalhes completos em `CLAUDE.md`.

## Estado atual

O MVP técnico base já está implementado com:
- monorepo com `frontend`, `backend` e `shared`;
- chat fim-a-fim (UI -> API -> agente -> resposta);
- seleção de modo (`adoption` e `training`);
- tools mockadas para:
	- pesquisa de cães (`searchDogs`),
	- geração de plano (`generateTrainingPlan`),
	- adaptação de plano (`adaptTrainingPlan`).

## Estrutura

- `frontend`: React + TypeScript + Vite
- `backend`: Node + Express + TypeScript
- `shared`: tipos partilhados entre frontend e backend

## Como correr localmente

Pré-requisitos:
- Node.js 16+ (recomendado 18+)
- npm

1. Instalar dependências

```bash
npm install --workspaces
```

2. Executar em desenvolvimento (frontend + backend)

```bash
npm run dev
```

3. Build de validação

```bash
npm run build
```

Endpoints backend:
- `GET /health`
- `POST /chat`

## Próximo passo sugerido

Substituir as tools mockadas por integrações reais:
1. PetFinder para o modo adoção.
2. Planner real de treino com persistência de sessões.