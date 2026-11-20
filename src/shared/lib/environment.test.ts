import { describe, expect, it } from "vitest";
import { isStaging, robotsRules, stagingHeaders } from "./environment";

describe("staging (entrega 6 §3, P13)", () => {
  it("reconhece o staging sem depender de maiúsculas e espaços", () => {
    expect(isStaging("staging")).toBe(true);
    expect(isStaging(" Staging ")).toBe(true);
    expect(isStaging("production")).toBe(false);
    expect(isStaging(undefined)).toBe(false);
  });

  it("fecha o robots.txt inteiro no staging", () => {
    expect(robotsRules(true)).toEqual([{ userAgent: "*", disallow: "/" }]);
  });

  it("mantém as regras de SEO fora do staging", () => {
    expect(robotsRules(false)).toEqual([{ userAgent: "*", allow: "/", disallow: ["/conta", "/checkout", "/admin", "/busca", "/carrinho"] }]);
  });

  it("manda noindex em toda resposta só no staging", () => {
    expect(stagingHeaders(true)).toEqual([{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]);
    expect(stagingHeaders(false)).toEqual([]);
  });
});
