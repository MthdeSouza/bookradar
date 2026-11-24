import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError, apiRequest } from "./api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna o payload JSON em respostas bem-sucedidas", async () => {
    const payload = { ok: true, value: 1 };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload, 200)));

    await expect(apiRequest("/api/test")).resolves.toEqual(payload);
  });

  it("lança ApiRequestError com mensagem e código da API em falhas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { code: "invalid_parameters", message: "Parâmetro inválido" } }, 400),
      ),
    );

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      name: "ApiRequestError",
      status: 400,
      code: "invalid_parameters",
      message: "Parâmetro inválido",
    });
  });

  it("lança ApiRequestError de rede quando fetch falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const error = await apiRequest("/api/test").catch((e) => e);
    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 0,
      code: "network_error",
      message: "Não foi possível conectar ao servidor.",
    });
  });
});
