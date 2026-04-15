import https from "node:https";
import type { Dog } from "../../../shared/src/types.js";

const BASE_URL = "https://www.adopta-me.org";
const LISTING_URL = "https://www.adopta-me.org/index.php";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cache: { expiresAt: number; dogs: Dog[] } | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        res.on("end", () => {
          const status = res.statusCode ?? 500;
          if (status < 200 || status >= 300) {
            reject(new Error(`Request failed (${status}) for ${url}`));
            return;
          }

          // O Adopta-me pode responder em latin1; esta conversao evita texto corrompido.
          const data = Buffer.concat(chunks).toString("latin1");
          resolve(data);
        });
      })
      .on("error", reject);
  });
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ccedil;/g, "c")
    .replace(/&atilde;/g, "a")
    .replace(/&aacute;/g, "a")
    .replace(/&eacute;/g, "e")
    .replace(/&iacute;/g, "i")
    .replace(/&oacute;/g, "o")
    .replace(/&uacute;/g, "u");
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function extractProfileLinks(html: string): string[] {
  const links = new Set<string>();
  const regex = /(?:https:\/\/www\.adopta-me\.org\/?)?(?:\/?animal\.php\?sid=[a-zA-Z0-9]+)/g;
  const matches = html.match(regex) ?? [];

  for (const match of matches) {
    const normalized = match.startsWith("/") ? match : `/${match}`;
    const absolute = match.startsWith("http") ? match : `${BASE_URL}${normalized}`;
    links.add(absolute);
  }

  return Array.from(links);
}

function parseAge(htmlText: string): Dog["age"] {
  if (/(Idade:\s*Beb[eé])/i.test(htmlText)) return "puppy";
  if (/Idade:\s*Jovem/i.test(htmlText)) return "young";
  if (/Idade:\s*(S[eé]nior|Idoso)/i.test(htmlText)) return "senior";
  return "adult";
}

function parseSex(htmlText: string): Dog["sex"] {
  if (/(Sexo:\s*F[eê]mea)|(Cadela)/i.test(htmlText)) return "female";
  return "male";
}

function parseSize(htmlText: string): Dog["size"] {
  if (/(Porte:\s*Pequeno)|(Porte:\s*Pequena)/i.test(htmlText)) return "small";
  if (/(Porte:\s*M[eé]dio)|(Porte:\s*M[eé]dia)/i.test(htmlText)) return "medium";
  return "large";
}

function parseBreed(htmlText: string): string {
  const breedMatch = htmlText.match(/(?:Cão|Cadela)\s*-\s*([^\n]+)/i);
  if (!breedMatch?.[1]) return "Raca desconhecida";
  return stripTags(breedMatch[1]).split("Idade:")[0].trim();
}

function parseName(html: string): string {
  const h2Match = html.match(/<h2[^>]*>\s*([^<]+)\s*<\/h2>/i);
  if (h2Match?.[1]) return stripTags(h2Match[1]);

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) return stripTags(titleMatch[1]).split("|")[0].trim();

  return "Sem nome";
}

function parseImage(html: string): string | null {
  const absoluteImage = html.match(/https:\/\/www\.adopta-me\.org\/media\/image\/[^"'\s<>]+/i);
  if (absoluteImage?.[0]) return absoluteImage[0];

  const relativeImage = html.match(/(?:\/)?media\/image\/[^"'\s<>]+/i);
  if (!relativeImage?.[0]) return null;

  const normalized = relativeImage[0].startsWith("/")
    ? relativeImage[0]
    : `/${relativeImage[0]}`;
  return `${BASE_URL}${normalized}`;
}

function parseDescription(html: string): string {
  const paragraphMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (paragraphMatch?.[1]) {
    const content = stripTags(paragraphMatch[1]);
    return content.slice(0, 260) || "Sem descricao disponivel.";
  }

  const flattened = stripTags(html);
  const snippet = flattened.slice(0, 260);
  return snippet || "Sem descricao disponivel.";
}

function parseShelterName(htmlText: string): string {
  const match = htmlText.match(/Nome:\s*([\s\S]*?)\s*Localidade:/i);
  if (match?.[1]) return stripTags(match[1]).trim();
  return "Associacao portuguesa";
}

function parseLocation(htmlText: string): string {
  const match = htmlText.match(/Localidade:\s*([\s\S]*?)\s*(Ver Contactos|Ver Lista|$)/i);
  if (match?.[1]) return stripTags(match[1]).trim();
  return "Portugal";
}

function toDogFromProfile(url: string, html: string): Dog | null {
  const text = stripTags(html);

  // Filtra apenas perfis de cao/cadela.
  if (!/(Cão|Cadela|cao|cadela)/i.test(text)) {
    return null;
  }

  const imageUrl = parseImage(html);
  if (!imageUrl) {
    return null;
  }

  return {
    id: `adoptame-${url.split("sid=")[1] ?? Date.now().toString()}`,
    source: "adopta-me",
    sourceUrl: url,
    name: parseName(html),
    breed: parseBreed(text),
    isMix: /rafeiro|mest/i.test(parseBreed(text)),
    age: parseAge(text),
    sex: parseSex(text),
    size: parseSize(text),
    photos: [imageUrl],
    description: parseDescription(html),
    goodWith: {
      children: null,
      dogs: null,
      cats: null
    },
    specialNeeds: false,
    shelter: {
      name: parseShelterName(text),
      address: parseLocation(text),
      lat: 0,
      lng: 0
    },
    available: true,
    listedAt: nowIso()
  };
}

export async function searchDogsFromAdoptaMe(city: string): Promise<Dog[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.dogs.map((dog) => ({ ...dog, distanceKm: 45 }));
  }

  const listingHtml = await httpsGet(LISTING_URL);
  const profileLinks = extractProfileLinks(listingHtml).slice(0, 10);

  const profiles = await Promise.allSettled(profileLinks.map((link) => httpsGet(link)));
  const dogs: Dog[] = [];

  for (let i = 0; i < profiles.length; i += 1) {
    const result = profiles[i];
    if (result.status !== "fulfilled") continue;

    const dog = toDogFromProfile(profileLinks[i], result.value);
    if (!dog) continue;

    dogs.push({
      ...dog,
      distanceKm: city.toLowerCase().includes("setubal") ? 5 : 45
    });
  }

  if (!dogs.length) {
    throw new Error("No dogs parsed from Adopta-me.");
  }

  cache = {
    expiresAt: Date.now() + CACHE_TTL_MS,
    dogs
  };

  return dogs;
}
