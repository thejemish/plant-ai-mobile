import { getSyncDb } from "@/store/db";

export type PestRow = {
  id: string;
  slug: string | null;
  name: string;
  scientific_name: string | null;
  crops: string | null;
  image_url: string | null;
  identification: string | null;
  damage: string | null;
  organic_md: string | null;
  chemical_md: string | null;
  beneficials: string | null;
  region: string | null;
};

export async function searchPests(query: string) {
  const db = await getSyncDb();
  const match = toFtsQuery(query);

  if (match) {
    try {
      const rows = await db.getAllAsync<PestRow>(
        `SELECT p.id, p.slug, p.name, p.scientific_name, p.crops, p.image_url, p.identification,
                p.damage, p.organic_md, p.chemical_md, p.beneficials, p.region
         FROM pests_fts
         JOIN pests p ON p.rowid = pests_fts.rowid
         WHERE pests_fts MATCH ?
           AND p.status = 'published'
         ORDER BY rank
         LIMIT 80`,
        match,
      );
      if (rows.length > 0) {
        return rows;
      }
    } catch {
      // Fall back to LIKE below.
    }
  }

  const term = `%${query.trim()}%`;
  return db.getAllAsync<PestRow>(
    `SELECT id, slug, name, scientific_name, crops, image_url, identification,
            damage, organic_md, chemical_md, beneficials, region
     FROM pests
     WHERE status = 'published'
       AND (? = '%%' OR name LIKE ? OR crops LIKE ? OR identification LIKE ? OR damage LIKE ?)
     ORDER BY updated_at DESC, name ASC
     LIMIT 80`,
    term,
    term,
    term,
    term,
    term,
  );
}

export async function loadPest(id: string) {
  const db = await getSyncDb();
  return db.getFirstAsync<PestRow>(
    `SELECT id, slug, name, scientific_name, crops, image_url, identification,
            damage, organic_md, chemical_md, beneficials, region
     FROM pests
     WHERE id = ? AND status = 'published'
     LIMIT 1`,
    id,
  );
}

function toFtsQuery(query: string) {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2)
    .slice(0, 8);
  return terms.length ? terms.map((term) => `${term}*`).join(" OR ") : "";
}
