import svgCaptcha from 'svg-captcha';

interface CaptchaEntry {
  text: string;
  expiresAt: number;
  attempts: number;
}

const store = new Map<string, CaptchaEntry>();

const CAPTCHA_TTL = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function cleanup(): void {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt < now) {
      store.delete(id);
    }
  }
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function generateCaptcha(): { id: string; svg: string } {
  cleanup();

  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0oOil1I',
    noise: 3,
    color: true,
    background: '#f4f4f5',
    width: 112,
    height: 40,
    fontSize: 36,
  });

  const id = randomId();
  store.set(id, {
    text: captcha.text.toLowerCase(),
    expiresAt: Date.now() + CAPTCHA_TTL,
    attempts: 0,
  });

  return { id, svg: captcha.data };
}

export function verifyCaptcha(id: string, text: string): boolean {
  const entry = store.get(id);
  if (!entry) return false;

  entry.attempts++;

  if (entry.expiresAt < Date.now() || entry.attempts > MAX_ATTEMPTS) {
    store.delete(id);
    return false;
  }

  if (entry.text !== text.toLowerCase().trim()) {
    if (entry.attempts >= MAX_ATTEMPTS) {
      store.delete(id);
    }
    return false;
  }

  store.delete(id);
  return true;
}
