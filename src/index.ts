interface Env {
  DB: D1Database;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/notes" && req.method === "POST") {
      const { content } = (await req.json()) as { content: string };
      await env.DB.prepare("INSERT INTO notes (content) VALUES (?)")
        .bind(content)
        .run();
      return Response.json({ ok: true });
    }

    if (url.pathname === "/notes") {
      const { results } = await env.DB.prepare(
        "SELECT id, content, created_at FROM notes ORDER BY id DESC LIMIT 50"
      ).all();
      return Response.json(results);
    }

    return Response.json({ ok: true, routes: ["GET /notes", "POST /notes"] });
  },
};
