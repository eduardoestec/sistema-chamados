import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!

export type AuthUser = { id: string; nivel: string; nome: string }

export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12)
}

export function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}

export function gerarToken(payload: AuthUser): string {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' })
}

export function verificarToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, SECRET) as AuthUser
  } catch {
    return null
  }
}
