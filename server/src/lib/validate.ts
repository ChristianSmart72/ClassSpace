import { FastifyReply } from 'fastify';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;

export function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v.trim());
}

export function isValidUrl(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 2048 && URL_RE.test(v.trim());
}

export function isNonEmptyString(v: unknown, maxLen = 2000): v is string {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= maxLen;
}

export function isIsoDate(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v));
}

export function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

export function fail(reply: FastifyReply, message: string, status = 400) {
  return reply.status(status).send({ error: message });
}
