import type { ApiErrorResponse } from "@/types/book";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new ApiRequestError("Não foi possível conectar ao servidor.", 0, "network_error");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse | null;
    const message = errorPayload?.error?.message ?? "Não foi possível concluir a pesquisa.";
    const code = errorPayload?.error?.code;
    throw new ApiRequestError(message, response.status, code);
  }

  return payload as T;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
