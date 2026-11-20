/**
 * Validação no navegador só para resposta rápida; a regra que vale é a da API (ADR-F02). Mesmas regras do backend:
 * senha de 12 a 128 sem regra de composição e fora das senhas comuns (entrega 6, S4), CPF com dígitos verificadores,
 * telefone com DDD.
 */

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) {
    return "Informe o e-mail.";
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Informe um e-mail válido.";
}

export const PASSWORD_HINT = "Pelo menos 12 caracteres. Uma frase funciona bem, como “minha joia preferida da loja”.";

// Mesma lista do backend (PasswordRules.cs): palavra comum enfeitada com números ou símbolos.
const COMMON_WORDS = new Set([
  "", "senha", "minhasenha", "senhasegura", "novasenha", "password", "mypassword", "passw", "pass", "qwerty",
  "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbnm", "abc", "abcdef", "abcdefgh", "admin", "administrador", "root",
  "login", "teste", "test", "usuario", "user", "brasil", "loja", "mo", "iloveyou", "teamo", "amor", "deus",
  "jesus", "flamengo", "corinthians", "palmeiras", "gremio", "internacional", "abcd", "aaaa", "welcome",
  "bemvindo", "letmein", "dragon", "monkey", "princesa", "estrela", "familia", "felicidade",
]);
const SEQUENCES = "abcdefghijklmnopqrstuvwxyz qwertyuiopasdfghjklzxcvbnm 01234567890 09876543210";

export function isCommonPassword(value: string): boolean {
  if (!value) {
    return false;
  }
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
  if (new Set(normalized).size <= 2) {
    return true;
  }
  if (normalized.length >= 6 && SEQUENCES.includes(normalized)) {
    return true;
  }
  const letters = normalized.replace(/[^\p{L}]/gu, "");
  return COMMON_WORDS.has(letters) || COMMON_WORDS.has([...letters].reverse().join(""));
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return "Informe a senha.";
  }
  if (value.length < 12) {
    return "A senha precisa ter pelo menos 12 caracteres. Uma frase funciona bem.";
  }
  if (value.length > 128) {
    return "A senha pode ter no máximo 128 caracteres.";
  }
  if (isCommonPassword(value)) {
    return "Essa senha é muito comum. Escolha outra, de preferência uma frase.";
  }
  return null;
}

export function validateFullName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 3 && name.length <= 120 ? null : "Informe o nome completo.";
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function validatePhone(value: string): string | null {
  let digits = onlyDigits(value);
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  const validDdd = digits.length >= 2 && digits[0] !== "0" && digits[1] !== "0";
  const validLength = digits.length === 10 || (digits.length === 11 && digits[2] === "9");
  return validDdd && validLength ? null : "Telefone inválido. Informe DDD + número.";
}

/** CPF opcional: vazio é válido. */
export function validateCpf(value: string): string | null {
  const digits = onlyDigits(value);
  if (digits.length === 0) {
    return null;
  }
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
    return "CPF inválido.";
  }
  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]) ? null : "CPF inválido.";
}

/**
 * Destino seguro depois do login: só caminhos internos (evita open redirect). O caminho é resolvido como o navegador
 * resolve, porque ele apaga tab e quebra de linha: `/\t/evil.com` passaria num teste de texto e viraria `//evil.com`
 * (entrega 6.2, revisão ASVS V5.1.5).
 */
export function safeNextPath(next: string | null | undefined, fallback = "/conta"): string {
  if (!next || !next.startsWith("/")) {
    return fallback;
  }
  const base = "https://loja.invalid";
  try {
    const url = new URL(next, base);
    return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
