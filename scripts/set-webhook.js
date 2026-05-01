// Run: node scripts/set-webhook.js
// Registers the Telegram webhook after deploy

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!BOT_TOKEN || !APP_URL) {
  console.error('Missing TELEGRAM_BOT_TOKEN or NEXT_PUBLIC_APP_URL');
  process.exit(1);
}

const webhookUrl = `${APP_URL}/api/telegram/webhook`;

fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: webhookUrl }),
})
  .then((r) => r.json())
  .then((data) => {
    console.log('Webhook set:', data);
    console.log('URL:', webhookUrl);
  });
