import { ApiError } from "./client";

/** Primeiro erro de cada campo do ProblemDetails (`errors`), pronto para mostrar ao lado do input. */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.problem?.errors) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(error.problem.errors)
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => [field, messages[0] ?? ""]),
  );
}

/** Mensagem geral do erro (arquivo 16 §7): 429 com tempo de espera, título do ProblemDetails ou o texto padrão. */
export function errorMessage(error: unknown, fallback = "Não foi possível concluir. Tente novamente."): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return error.problem?.detail ?? "Muitas tentativas. Aguarde um minuto e tente de novo.";
    }
    if (error.problem?.errors && Object.keys(error.problem.errors).length > 0) {
      return "Confira os campos destacados.";
    }
    return error.problem?.title ?? fallback;
  }
  if (error instanceof TypeError) {
    return "Sem conexão com a loja. Verifique sua internet.";
  }
  return fallback;
}
