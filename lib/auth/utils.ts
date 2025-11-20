import { hash } from 'bcrypt'
import { randomBytes } from 'crypto'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateVerificationUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/verify-email/${token}`
}

export function generateResetPasswordUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return `${baseUrl}/reset-password/${token}`
}

export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}
