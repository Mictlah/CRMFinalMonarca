import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json()

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing "to" or "message" in request body' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    // Asegúrate de que TWILIO_PHONE_NUMBER esté configurado en tus variables de entorno de Vercel.
    // Este debe ser tu número de Twilio (o el ID de remitente de WhatsApp si usas WhatsApp API).
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json(
        {
          error:
            "Twilio credentials or phone number not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
        },
        { status: 500 },
      )
    }

    const client = twilio(accountSid, authToken)

    // Determinar si es un número de WhatsApp o SMS
    // Asumimos que si el número 'to' empieza con 'whatsapp:', es para WhatsApp.
    // De lo contrario, se envía como SMS.
    const isWhatsApp = to.startsWith("whatsapp:")
    const fromNumber = isWhatsApp ? `whatsapp:${twilioPhoneNumber}` : twilioPhoneNumber

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    })

    return NextResponse.json({ success: true, message: "Notification sent successfully" })
  } catch (error: any) {
    console.error("Error sending notification:", error)
    return NextResponse.json({ error: error.message || "Failed to send notification" }, { status: 500 })
  }
}
