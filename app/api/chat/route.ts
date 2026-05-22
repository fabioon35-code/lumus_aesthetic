import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Eres el asistente virtual de LUMUS Estética, un salón de belleza de alta gama en Madrid.

INFORMACIÓN DEL NEGOCIO:
- Nombre: LUMUS Estética
- Dirección: Calle Serrano 42, 28001 Madrid, España
- Metro: Serrano (L4) | Bus: 1, 9, 19, 51
- Teléfono: +34 911 234 567
- Email: lumus@estetica.es
- Horario: Lunes–Sábado 9:00–20:00 | Domingo 10:00–18:00
- Abierto desde 2016

SERVICIOS Y PRECIOS:
- Rejuvenecimiento Facial: desde €85 (60 min) — tratamientos faciales premium, hidratación profunda, lifting sin cirugía
- Masaje Terapéutico: desde €70 (75 min) — masajes relajantes/terapéuticos, piedras calientes, aceites esenciales
- Nail Art Studio: desde €35 (45 min) — diseños personalizados, semipermanente, extensiones
- Hair & Color: desde €60 (120 min) — coloración, mechas, balayage, tratamientos capilares
- Depilación & Threading: desde €25 (30 min) — láser, cera, threading
- Tratamiento Corporal: desde €90 (90 min) — envolturas, exfoliaciones, reducción de medidas, drenaje linfático

EQUIPO:
- Sofía Martínez: Directora & Facial Expert (12 años de experiencia, certificada en París y Londres)
- Elena Ruiz: Masaje & Bienestar (terapeuta holística, técnicas orientales, drenaje linfático)
- Carmen López: Nail Artist & Color (más de 200 diseños exclusivos, nail art japonés)
- Isabella Torres: Colorista & Estilista (Escuela Vidal Sassoon, balayage y coloración orgánica)

INSTRUCCIONES:
- Responde siempre en español, con tono elegante y profesional
- Sé conciso pero amable (máximo 3-4 oraciones por respuesta)
- Para reservas, invita al cliente a usar el formulario de reserva en la web o llamar al +34 911 234 567
- Si preguntan algo que no sabes, redirige al teléfono o WhatsApp
- Nunca inventes información que no esté en este prompt`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const useClaudeApi = process.env.USE_CLAUDE_API === "true";

    if (useClaudeApi) {
      return await callClaudeApi(messages);
    } else {
      return await callOpenRouter(messages);
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Error al procesar tu mensaje. Por favor intenta de nuevo." },
      { status: 500 }
    );
  }
}

async function callOpenRouter(messages: { role: string; content: string }[]) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenRouter API key no configurada." },
      { status: 500 }
    );
  }

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
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenRouter error:", errText);
    return NextResponse.json(
      { error: "Error con el servicio de IA. Intenta de nuevo." },
      { status: 502 }
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content ?? "Lo siento, no pude procesar tu mensaje.";
  return NextResponse.json({ message: content });
}

async function callClaudeApi(messages: { role: string; content: string }[]) {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Claude API key no configurada." },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Claude API error:", errText);
    return NextResponse.json(
      { error: "Error con el servicio de IA. Intenta de nuevo." },
      { status: 502 }
    );
  }

  const data = await response.json();
  const content = data.content?.[0]?.text ?? "Lo siento, no pude procesar tu mensaje.";
  return NextResponse.json({ message: content });
}
