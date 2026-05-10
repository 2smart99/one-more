import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from?: { first_name: string };
  text?: string;
}

interface TelegramUpdate {
  message?: TelegramMessage;
}

export async function GET() {
  if (!BOT_TOKEN) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
  const data = await res.json();
  return NextResponse.json(data);
}

async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  });
}

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN || !APP_URL) return NextResponse.json({ ok: true });

  const update: TelegramUpdate = await req.json();

  const message = update.message;
  if (!message?.text) return NextResponse.json({ ok: true });

  const chatId = message.chat.id;
  const name = message.from?.first_name ?? 'atleta';

  if (message.text === '/start') {
    await sendMessage(
      chatId,
      `💪 <b>Ciao ${name}!</b>\n\nBenvenuto su <b>One More</b> — il tuo tracker di allenamento.\n\nPremi il bottone qui sotto per aprire l'app e iniziare ad allenarti.`,
      {
        inline_keyboard: [[
          {
            text: '🏋️ Avvia One More',
            web_app: { url: APP_URL },
          },
        ]],
      }
    );
  }

  return NextResponse.json({ ok: true });
}
