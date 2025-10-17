import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
});

export const signupSchema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
  confirmPassword: z.string(),
  adminToken: z.string().min(1, { message: 'Admin token é obrigatório' }),
  orgName: z.string().trim().min(1, { message: 'Nome da organização é obrigatório' }).max(100, { message: 'Nome muito longo' })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

export const messageSchema = z.object({
  text: z.string().trim().min(1, { message: 'Mensagem não pode ser vazia' }).max(5000, { message: 'Mensagem muito longa' })
});
