import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function GET() {
  if (!BOT_TOKEN) return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });
  if (!APP_URL) return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not set' }, { status: 500 });

  const webhookUrl = `${APP_URL}/api/telegram/webhook`;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });
  const data = await res.json();

  return NextResponse.json({ webhookUrl, result: data });
}
