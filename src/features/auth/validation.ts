/**
 * Validação no navegador só para resposta rápida; a regra que vale é a da API (ADR-F02). Mesmas regras do backend:
 * senha de 8 a 128 com maiúscula, minúscula e número (RF-001 CA3), CPF com dígitos verificadores, telefone com DDD.
 */

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) {
    return "Informe o e-mail.";
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : "Informe um e-mail válido.";
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return "Informe a senha.";
  }
  if (value.length < 8 || value.length > 128) {
    return "A senha deve ter entre 8 e 128 caracteres.";
  }
  if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/\d/.test(value)) {
    return "A senha precisa ter letra maiúscula, letra minúscula e número.";
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

/** Destino seguro depois do login: só caminhos internos (evita open redirect). */
export function safeNextPath(next: string | null | undefined, fallback = "/conta"): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
