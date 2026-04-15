import type { Dog } from "../../../shared/src/types";

interface DogResultsProps {
  dogs: Dog[];
}

export function DogResults({ dogs }: DogResultsProps) {
  if (!dogs.length) return null;

  return (
    <section className="panel">
      <h3>Caes encontrados</h3>
      <div className="dog-grid">
        {dogs.map((dog) => (
          <article key={dog.id} className="dog-card">
            <img src={dog.photos[0]} alt={dog.name} />
            <div className="dog-meta">
              <strong>{dog.name}</strong>
              <span>{dog.breed}</span>
              <span>
                {dog.age} · {dog.size} · {dog.sex}
              </span>
              <p>{dog.description}</p>
              <a href={dog.sourceUrl} target="_blank" rel="noreferrer">
                Ver fonte
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
