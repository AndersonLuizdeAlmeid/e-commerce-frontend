import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, fileProblem, isLowResolution, moveItem, runWithLimit, suggestAlt } from "./photos";

describe("fileProblem (RF-061)", () => {
  it.each(["foto.jpg", "FOTO.JPEG", "foto.png", "foto.webp", "IMG_0001.HEIC", "foto.heif"])("aceita %s", (name) => {
    expect(fileProblem({ name, size: 1000 })).toBeNull();
  });

  it.each(["foto.gif", "documento.pdf", "sem-extensao", "foto.svg"])("recusa %s", (name) => {
    expect(fileProblem({ name, size: 1000 })).toContain("Formato");
  });

  it("recusa acima de 15 MB e arquivo vazio", () => {
    expect(fileProblem({ name: "foto.jpg", size: MAX_FILE_BYTES + 1 })).toContain("15 MB");
    expect(fileProblem({ name: "foto.jpg", size: MAX_FILE_BYTES })).toBeNull();
    expect(fileProblem({ name: "foto.jpg", size: 0 })).toContain("vazio");
  });
});

describe("suggestAlt", () => {
  it("junta produto e acabamento", () => {
    expect(suggestAlt("Anel Solitário", "Dourado")).toBe("Anel Solitário — Dourado");
    expect(suggestAlt("Bolsa Shopper", null)).toBe("Bolsa Shopper");
  });

  it("respeita o limite da API", () => {
    expect(suggestAlt("x".repeat(300))).toHaveLength(200);
  });
});

describe("isLowResolution (RF-061 CA3)", () => {
  it("olha o lado maior", () => {
    expect(isLowResolution(1200, 1500)).toBe(true);
    expect(isLowResolution(1200, 1600)).toBe(false);
    expect(isLowResolution(2400, 800)).toBe(false);
  });

  it("não avisa em foto antiga, sem medidas", () => {
    expect(isLowResolution(null, null)).toBe(false);
  });
});

describe("moveItem", () => {
  it("move para a frente e para trás sem mudar a lista original", () => {
    const list = ["a", "b", "c"];
    expect(moveItem(list, 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a"]);
    expect(list).toEqual(["a", "b", "c"]);
  });
});

describe("runWithLimit", () => {
  it("nunca passa do limite e processa tudo", async () => {
    let running = 0;
    let peak = 0;
    const done: number[] = [];

    await runWithLimit([1, 2, 3, 4, 5, 6, 7], 3, async (item) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      done.push(item);
      running -= 1;
    });

    expect(peak).toBe(3);
    expect(done.toSorted()).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("uma falha não para as outras (RF-061 CA1)", async () => {
    const done: number[] = [];

    await runWithLimit([1, 2, 3], 2, async (item) => {
      if (item === 1) {
        throw new Error("falhou");
      }
      done.push(item);
    });

    expect(done.toSorted()).toEqual([2, 3]);
  });
});
