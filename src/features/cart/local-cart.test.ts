import { describe, expect, it } from "vitest";
import { MAX_ITEMS, MAX_QUANTITY_PER_ITEM, addLine, countPieces, parseLines, removeLine, setLineQuantity } from "./local-cart";

const line = (variantId: string, quantity = 1) => ({ variantId, quantity });

describe("parseLines", () => {
  it("lê o que a loja gravou", () => {
    expect(parseLines(JSON.stringify([line("a", 2), line("b")]))).toEqual([line("a", 2), line("b")]);
  });

  it.each([null, "", "não é json", "{}", "42", "null"])("trata %j como sacola vazia", (raw) => {
    expect(parseLines(raw)).toEqual([]);
  });

  it("ignora linhas adulteradas, sem perder as válidas", () => {
    const raw = JSON.stringify([line("a"), null, { variantId: 1, quantity: 1 }, line("b", 0), line("c", -2), line("d", 1.5), { variantId: "e" }]);
    expect(parseLines(raw)).toEqual([line("a")]);
  });

  it("junta linhas repetidas e respeita os limites", () => {
    expect(parseLines(JSON.stringify([line("a", 60), line("a", 60)]))).toEqual([line("a", MAX_QUANTITY_PER_ITEM)]);
    const many = Array.from({ length: MAX_ITEMS + 5 }, (_, index) => line(`v${index}`));
    expect(parseLines(JSON.stringify(many))).toHaveLength(MAX_ITEMS);
  });
});

describe("addLine", () => {
  it("acrescenta peça nova e soma a que já está na sacola", () => {
    expect(addLine([], "a", 2)).toEqual([line("a", 2)]);
    expect(addLine([line("a", 2), line("b")], "a", 3)).toEqual([line("a", 5), line("b")]);
  });

  it("recusa passar do limite por peça", () => {
    expect(addLine([line("a", MAX_QUANTITY_PER_ITEM)], "a", 1)).toBe("quantity");
    expect(addLine([], "a", MAX_QUANTITY_PER_ITEM + 1)).toBe("quantity");
  });

  it("recusa peça nova além do limite de peças diferentes, mas soma a que já está", () => {
    const full = Array.from({ length: MAX_ITEMS }, (_, index) => line(`v${index}`));
    expect(addLine(full, "nova", 1)).toBe("items");
    expect(addLine(full, "v0", 1)).not.toBe("items");
  });
});

describe("setLineQuantity", () => {
  it("troca só a peça pedida e fica entre 1 e o limite", () => {
    expect(setLineQuantity([line("a", 2), line("b")], "a", 5)).toEqual([line("a", 5), line("b")]);
    expect(setLineQuantity([line("a", 2)], "a", 0)).toEqual([line("a", 1)]);
    expect(setLineQuantity([line("a", 2)], "a", 500)).toEqual([line("a", MAX_QUANTITY_PER_ITEM)]);
  });
});

describe("removeLine e countPieces", () => {
  it("tira a peça e conta as unidades", () => {
    expect(removeLine([line("a"), line("b")], "a")).toEqual([line("b")]);
    expect(removeLine([line("a")], "x")).toEqual([line("a")]);
    expect(countPieces([line("a", 2), line("b", 3)])).toBe(5);
    expect(countPieces([])).toBe(0);
  });
});
