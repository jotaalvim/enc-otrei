# Plano de Arranque do DogFinder Agent (MVP)

## Objetivo
Construir um MVP vertical funcional (fim-a-fim) com os dois modos:
- adocao de caes;
- treino personalizado para quem ja tem cao.

A prioridade e ter o loop conversacional a funcionar antes de expandir fontes, refinamentos e automacoes.

## Escopo do MVP 1
Entregar uma primeira versao funcional com:
- selecao inicial de modo: "Quero adotar" vs "Quero treinar o meu cao";
- modo adocao com pesquisa simples usando 1 fonte (PetFinder);
- modo treino com plano semanal basico gerado a partir de contexto recolhido na conversa.

## Fase 1: Setup e Estrutura Base
### Resultado esperado
Repositorio com estrutura clara para frontend, backend e tipos partilhados.

### Tarefas
- criar frontend (React + TypeScript);
- criar backend (Node.js + Express);
- criar pasta shared para tipos comuns;
- configurar variaveis de ambiente e scripts de arranque.

## Fase 2: Loop Conversacional Base
### Resultado esperado
Utilizador envia mensagem no chat e recebe resposta do agente com suporte a tool calls.

### Tarefas
- frontend envia mensagens para o backend;
- backend expoe endpoint de chat;
- backend chama LLM com system prompt;
- processar resposta direta e tool calls;
- devolver resposta final para UI do chat.

## Fase 3: Contratos de Tools (com mocks)
### Resultado esperado
Arquitetura pronta para crescer sem bloquear UX.

### Tarefas
Definir assinaturas e respostas mock para:
- search_dogs(params)
- get_location(cityName)
- generate_training_plan(params)
- log_training_session(session)
- adapt_training_plan(progress)

Nota: nesta fase, respostas mock sao aceitaveis para validar experiencia conversacional e navegacao.

## Fase 4: Primeira Fatia Funcional (3 a 5 dias)
### Resultado esperado
Fluxo minimo do modo treino totalmente funcional no chat.

### Criterios de aceite
- utilizador escolhe modo treino;
- agente faz 2-3 perguntas chave sobre o cao;
- agente gera plano semanal basico;
- plano aparece no chat num formato legivel.

## Fase 5: Integracao Inicial no Modo Adocao
### Resultado esperado
Primeira pesquisa real de caes.

### Tarefas
- integrar PetFinder (sem multi-fonte nesta etapa);
- mapear resposta para modelo Dog normalizado;
- apresentar resultados no chat (cards simples).

## Ordem Recomendada de Implementacao
1. Setup do projeto (frontend + backend + shared)
2. Endpoint de chat fim-a-fim
3. Selecao de modo no chat
4. Tools mockadas para adocao e treino
5. Renderizacao de plano de treino no frontend
6. Integracao real com PetFinder

## Checklist Tecnica Minima
- [ ] Estrutura de pastas criada
- [ ] Scripts de run local funcionam
- [ ] Endpoint /chat operacional
- [ ] Selecao de modo implementada
- [ ] generate_training_plan (mock) ativo
- [ ] search_dogs (mock) ativo
- [ ] Primeiro plano de treino renderizado
- [ ] Primeiros resultados de adocao renderizados

## O que nao fazer no primeiro sprint
- nao integrar todas as fontes de adocao de uma vez;
- nao otimizar prompts prematuramente;
- nao construir analytics/favoritos antes do loop base estar estavel;
- nao complicar persistencia sem validar primeiro a experiencia conversacional.

## Proximo Passo Imediato
Criar o esqueleto tecnico e arrancar o endpoint de chat com tools mockadas.
