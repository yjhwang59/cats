import type { Env } from '../types';

function json(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function trim(s: unknown): string {
  return typeof s === 'string' ? s.trim() : '';
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data = (await context.request.json()) as Record<string, unknown>;
    const name = trim(data?.name);
    const contact = trim(data?.contact);
    const message = trim(data?.message);
    const source_version = trim(data?.source_version) || 'v1.0.0';

    if (!name || name.length > 50) {
      return json(400, { ok: false, error: '請填寫姓名（最多 50 字）' });
    }
    if (!contact || contact.length > 100) {
      return json(400, { ok: false, error: '請填寫 Email 或手機（最多 100 字）' });
    }
    if (!message || message.length > 2000) {
      return json(400, { ok: false, error: '請填寫訊息內容（最多 2000 字）' });
    }

    const created_at = new Date().toISOString();
    await context.env.DB.prepare(
      `INSERT INTO adoption_inquiries (name, contact, message, created_at, source_version) VALUES (?, ?, ?, ?, ?)`
    )
      .bind(name, contact, message, created_at, source_version)
      .run();

    return json(200, { ok: true, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return json(500, { ok: false, error: '伺服器錯誤', detail: message });
  }
};
