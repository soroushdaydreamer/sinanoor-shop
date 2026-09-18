import { neon } from "@neondatabase/serverless";

function toPostgres(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

export function createDatabase(connectionString) {
  if (!connectionString) throw new Error("DATABASE_URL is not configured");
  const sql = neon(connectionString);

  return {
    prepare(statement) {
      return {
        bind(...values) {
          const query = toPostgres(statement);
          return {
            async first() {
              const rows = await sql(query, values);
              return rows[0] || null;
            },
            async all() {
              const rows = await sql(query, values);
              return { results: rows };
            },
            async run() {
              const isInsert = /^\s*insert\s/i.test(statement);
              const executable = isInsert && !/\breturning\b/i.test(statement)
                ? `${query} RETURNING id`
                : query;
              const rows = await sql(executable, values);
              return { meta: { last_row_id: rows[0]?.id ?? null, changes: rows.length } };
            },
          };
        },
        first: async () => {
          const rows = await sql(toPostgres(statement), []);
          return rows[0] || null;
        },
        all: async () => ({ results: await sql(toPostgres(statement), []) }),
        run: async () => {
          const rows = await sql(toPostgres(statement), []);
          return { meta: { last_row_id: rows[0]?.id ?? null, changes: rows.length } };
        },
      };
    },
  };
}

export function assertDatabase(env) {
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
}
