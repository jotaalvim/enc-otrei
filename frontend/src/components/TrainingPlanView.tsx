import type { TrainingPlan } from "../../../shared/src/types";

interface TrainingPlanViewProps {
  plan?: TrainingPlan;
}

export function TrainingPlanView({ plan }: TrainingPlanViewProps) {
  if (!plan) return null;

  return (
    <section className="panel">
      <h3>Plano de treino semanal</h3>
      <p>
        Objetivo principal: <strong>{plan.mainGoal}</strong>
      </p>
      <p>
        Sessoes por semana: <strong>{plan.sessionsPerWeek}</strong>
      </p>

      <div className="exercise-list">
        {plan.exercises.map((exercise) => (
          <article key={exercise.id} className="exercise-card">
            <h4>{exercise.title}</h4>
            <p>{exercise.objective}</p>
            <ul>
              {exercise.steps.map((step, index) => (
                <li key={`${exercise.id}-${index}`}>{step}</li>
              ))}
            </ul>
            <p>
              Duracao: {exercise.durationMinutes} min · Dificuldade: {exercise.difficulty}
            </p>
            <p>
              Criterio de sucesso: <strong>{exercise.successCriteria}</strong>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
