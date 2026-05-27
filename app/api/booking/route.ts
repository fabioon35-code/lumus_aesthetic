import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const SERVICE_DURATIONS: Record<string, number> = {
  "Rejuvenecimiento Facial": 60,
  "Masaje Terapéutico": 75,
  "Nail Art Studio": 45,
  "Hair & Color": 120,
  "Depilación & Threading": 30,
  "Tratamiento Corporal": 90,
};

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function clientEmailHtml(data: {
  name: string;
  service: string;
  dateLabel: string;
  time: string;
  phone: string;
  email: string;
  confirmNum: string;
}) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    /* Dark mode overrides — applied automatically when user has dark mode enabled */
    @media (prefers-color-scheme: dark) {
      .em-wrap   { background-color: #0A0A0A !important; }
      .em-card   { background-color: #111111 !important; border-color: rgba(201,169,110,.2) !important; }
      .em-detail { background-color: rgba(201,169,110,.05) !important; border-color: rgba(201,169,110,.15) !important; }
      .em-title  { color: #F5EDD8 !important; }
      .em-body   { color: #8A7A64 !important; }
      .em-name   { color: #D4C4A8 !important; }
      .em-val    { color: #F5EDD8 !important; }
      .em-label  { color: #8A7A64 !important; }
      .em-gold   { color: #C9A96E !important; }
      .em-divider{ border-top-color: rgba(201,169,110,.15) !important; }
      .em-note   { color: #8A7A64 !important; }
      .em-footer { border-top-color: rgba(201,169,110,.08) !important; }
      .em-copy   { color: #8A7A64 !important; }
    }
  </style>
</head>
<body class="em-wrap" style="margin:0;padding:0;background:#F0EAE0;font-family:'Montserrat',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="em-wrap" style="background:#F0EAE0;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" class="em-card" style="background:#FFFFFF;border:1px solid #DDD0B8;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#A0804A,#C9A96E);padding:36px;text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:32px;font-weight:300;letter-spacing:12px;color:#0A0A0A;">LUMUS</p>
            <p style="margin:8px 0 0;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:rgba(10,10,10,.7);">Estética de Alta Gama · Santiago del Estero</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 36px;">
            <p class="em-gold" style="margin:0 0 8px;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#A0804A;">Confirmación de Cita</p>
            <p class="em-title" style="margin:0 0 24px;font-family:Georgia,serif;font-size:26px;font-weight:300;color:#2A1F10;line-height:1.2;">
              ¡Tu reserva está <em style="font-style:italic;color:#C9A96E;">confirmada</em>!
            </p>
            <p class="em-body" style="margin:0 0 28px;font-size:13px;color:#6B5A48;line-height:1.8;">
              Hola <strong class="em-name" style="color:#3A2C1E;">${data.name}</strong>, hemos recibido tu reserva y en menos de 2 horas recibirás confirmación de nuestro equipo.
            </p>
            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0" class="em-detail" style="background:#FAF6EF;border:1px solid #DDD0B8;margin-bottom:28px;">
              <tr><td style="padding:24px 28px;">
                ${[
                  ["Servicio", data.service],
                  ["Fecha", data.dateLabel],
                  ["Hora", data.time],
                  ["Teléfono", data.phone],
                ].map(([label, val]) => `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                  <tr>
                    <td class="em-label" style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8A7A64;">${label}</td>
                    <td align="right" class="em-val" style="font-size:13px;color:#2A1F10;font-weight:500;">${val}</td>
                  </tr>
                </table>`).join("")}
                <table width="100%" cellpadding="0" cellspacing="0" class="em-divider" style="border-top:1px solid #DDD0B8;padding-top:16px;margin-top:4px;">
                  <tr>
                    <td align="center">
                      <p class="em-gold" style="margin:0;font-family:Georgia,serif;font-size:22px;color:#A0804A;">${data.confirmNum}</p>
                      <p class="em-label" style="margin:4px 0 0;font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#8A7A64;">Número de Confirmación</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <!-- Info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td class="em-note" style="font-size:12px;color:#6B5A48;line-height:1.9;">
                  <strong class="em-gold" style="color:#A0804A;">📍 Dirección:</strong> Av. Belgrano 450, Santiago del Estero<br>
                  <strong class="em-gold" style="color:#A0804A;">📞 Teléfono:</strong> +54 385 400 0000<br>
                  <strong class="em-gold" style="color:#A0804A;">🕐 Horario:</strong> Lun–Sáb 9:00–20:00 · Dom 10:00–18:00
                </td>
              </tr>
            </table>
            <p class="em-note" style="margin:0;font-size:12px;color:#6B5A48;line-height:1.8;">Si necesitas modificar o cancelar tu cita, contáctanos con al menos 24h de antelación.</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td class="em-footer" style="padding:20px 36px;border-top:1px solid #E8DDD0;text-align:center;">
            <p class="em-copy" style="margin:0;font-size:10px;color:#8A7A64;letter-spacing:1px;">© 2024 LUMUS Estética · lumus@estetica.com.ar</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function createCalendarEvent(data: {
  name: string;
  service: string;
  dateISO: string;
  time: string;
  phone: string;
  email: string;
  confirmNum: string;
}) {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return null;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  const calendar = google.calendar({ version: "v3", auth });
  const duration = SERVICE_DURATIONS[data.service] ?? 60;
  const [hours, minutes] = data.time.split(":").map(Number);
  const [year, month, day] = data.dateISO.split("-").map(Number);
  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + duration * 60000);

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    requestBody: {
      summary: `LUMUS ✦ ${data.name} — ${data.service}`,
      description: `Reserva ${data.confirmNum}\nCliente: ${data.name}\nTeléfono: ${data.phone}\nEmail: ${data.email}\nServicio: ${data.service} (${duration} min)`,
      start: { dateTime: start.toISOString(), timeZone: "America/Argentina/Cordoba" },
      end: { dateTime: end.toISOString(), timeZone: "America/Argentina/Cordoba" },
      colorId: "5",
    },
  });

  return event.data.htmlLink;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, service, dateLabel, dateISO, time, phone, email, confirmNum } = body;

    if (!name || !service || !dateISO || !time || !phone) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const results: { email?: boolean; calendar?: string | null } = {};

    // Send emails
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = createTransporter();
        const emailPromises = [];

        // Email to client
        if (email) {
          emailPromises.push(
            transporter.sendMail({
              from: `"LUMUS Estética" <${process.env.GMAIL_USER}>`,
              to: email,
              subject: `✦ Reserva Confirmada — LUMUS Estética (${confirmNum})`,
              html: clientEmailHtml({ name, service, dateLabel: dateLabel || dateISO, time, phone, email, confirmNum }),
            })
          );
        }

        // Notification to salon
        emailPromises.push(
          transporter.sendMail({
            from: `"LUMUS Bot" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: `Nueva Reserva — ${name} — ${service}`,
            text: `Confirmación: ${confirmNum}\nCliente: ${name}\nServicio: ${service}\nFecha: ${dateLabel || dateISO}\nHora: ${time}\nTeléfono: ${phone}\nEmail: ${email || "—"}`,
          })
        );

        await Promise.all(emailPromises);
        results.email = true;
      } catch (err) {
        console.error("Email error:", err);
      }
    }

    // Google Calendar
    try {
      const calLink = await createCalendarEvent({ name, service, dateISO, time, phone, email, confirmNum });
      results.calendar = calLink;
    } catch (err) {
      console.error("Calendar error:", err);
    }

    return NextResponse.json({ success: true, confirmNum, ...results });
  } catch (err) {
    console.error("Booking error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
