import { describe, expect, it } from "vitest";
import { z } from "./zod";

describe("zod da loja", () => {
  it("roda sem JIT, porque a CSP não libera eval", () => {
    expect(z.config().jitless).toBe(true);
  });

  it("continua validando normalmente", () => {
    const schema = z.object({ nome: z.string().min(2) });
    expect(schema.safeParse({ nome: "MO" }).success).toBe(true);
    expect(schema.safeParse({ nome: "M" }).success).toBe(false);
  });
});
