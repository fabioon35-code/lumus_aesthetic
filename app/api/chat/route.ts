import { NextRequest, NextResponse } from "next/server";

const VALID_SERVICES = [
  "Rejuvenecimiento Facial",
  "Masaje Terapéutico",
  "Nail Art Studio",
  "Hair & Color",
  "Depilación & Threading",
  "Tratamiento Corporal",
];

const VALID_TIMES = ["09:00", "10:30", "12:00", "15:00", "17:00", "19:00"];

function buildSystemPrompt(today: string, bookingContext: Record<string, string>) {
  const ctxLines = Object.entries(bookingContext)
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");
  const ctxStr = ctxLines ? `\nCONTEXTO DE RESERVA ACTUAL (campos ya recopilados):\n${ctxLines}\n` : "";

  return `Eres el asistente virtual de LUMUS Estética, salón de belleza de alta gama en Santiago del Estero, Argentina.
Hoy es: ${today}
${ctxStr}
INFORMACIÓN DEL NEGOCIO:
- Dirección: Av. Belgrano 450, Santiago del Estero, Argentina
- Teléfono: +54 385 400 0000 | Email: lumus@estetica.com.ar
- Horario: Lun–Sáb 9:00–20:00 | Dom 10:00–18:00

SERVICIOS DISPONIBLES (usar nombre EXACTO):
${VALID_SERVICES.map((s) => `- ${s}`).join("\n")}

HORARIOS DISPONIBLES: ${VALID_TIMES.join(", ")}

INSTRUCCIONES CRÍTICAS:
1. Responde SIEMPRE con JSON válido, sin texto fuera del JSON, sin markdown.
2. El campo "message" contiene tu respuesta en español, tono elegante, puede contener HTML básico (<strong>, <br>).
3. Extrae datos de reserva de CUALQUIER mensaje del usuario, aunque los dé todos a la vez.
4. Si el usuario menciona un servicio parecido (ej: "masaje", "facial", "uñas"), mapéalo al nombre exacto de la lista.
5. Convierte fechas relativas ("mañana", "el lunes", "el viernes que viene") a ISO usando la fecha de hoy (${today}).
6. Convierte horas aproximadas ("las 3", "a las 10") al slot más cercano disponible.
7. Valida: fechas deben ser futuras, servicios deben estar en la lista, horas deben ser slots válidos.
8. Si un campo es inválido, inclúyelo en "errors" con explicación clara y NO lo incluyas en "booking".
9. Si el usuario NO tiene intención de reservar, pon "intent": "info" y "booking": null.
10. Si ya tienes todos los campos (name, service, dateISO, time, phone, email) y el contexto los confirma, pon "readyToConfirm": true.

FORMATO DE RESPUESTA (JSON estricto):
{
  "message": "texto de respuesta para el usuario",
  "intent": "booking | info | cancel | other",
  "booking": {
    "name": "nombre completo o null",
    "service": "nombre exacto del servicio o null",
    "dateISO": "YYYY-MM-DD o null",
    "dateLabel": "texto legible ej: viernes 23 may. o null",
    "time": "HH:MM o null",
    "phone": "teléfono o null",
    "email": "email o null"
  },
  "errors": [{
    "field": "Nombre Completo | Servicio | Fecha | Hora | Telefono | E-mail",
     "message": "mensaje de error"
}],
  "readyToConfirm": false
}`;
}

function parseResponse(raw: string): Record<string, unknown> {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch { /* fall through */ }
    }
    return { message: raw, intent: "other", booking: null, errors: [], readyToConfirm: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, bookingContext = {}, today = new Date().toISOString().split("T")[0] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const systemPrompt = buildSystemPrompt(today, bookingContext);
    const useClaudeApi = process.env.USE_CLAUDE_API === "true";

    if (useClaudeApi) {
      return await callClaudeApi(messages, systemPrompt);
    } else {
      return await callOpenRouter(messages, systemPrompt);
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Error al procesar tu mensaje." }, { status: 500 });
  }
}

async function callOpenRouter(messages: { role: string; content: string }[], systemPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OpenRouter API key no configurada." }, { status: 500 });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "LUMUS Estética",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-v4-flash:free",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 600,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    console.error("OpenRouter error:", await response.text());
    return NextResponse.json({ error: "Error con el servicio de IA." }, { status: 502 });
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  return NextResponse.json(parseResponse(raw));
}

async function callClaudeApi(messages: { role: string; content: string }[], systemPrompt: string) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Claude API key no configurada." }, { status: 500 });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    }),
  });

  if (!response.ok) {
    console.error("Claude API error:", await response.text());
    return NextResponse.json({ error: "Error con el servicio de IA." }, { status: 502 });
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text ?? "{}";
  return NextResponse.json(parseResponse(raw));
}
