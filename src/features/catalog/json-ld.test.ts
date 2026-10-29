import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, productJsonLd } from "./json-ld";
import { shirtFixture, singleVariantFixture } from "./test-data";

const URL_PRODUTO = "https://loja.teste/produto/camiseta-basica";

describe("JSON-LD de produto (SEO-05)", () => {
  it("usa ProductGroup com uma oferta por variação, disponibilidade e GTIN", () => {
    const data = productJsonLd(shirtFixture(), URL_PRODUTO) as {
      "@type": string;
      variesBy: string[];
      hasVariant: Array<{ sku: string; gtin?: string; color?: string; size?: string; offers: Record<string, string> }>;
    };

    expect(data["@type"]).toBe("ProductGroup");
    expect(data.variesBy).toEqual(["https://schema.org/color", "https://schema.org/size"]);
    expect(data.hasVariant).toHaveLength(3);

    const blueMedium = data.hasVariant.find((variant) => variant.sku === "CAM-AZUL-M")!;
    expect(blueMedium.gtin).toBe("7891234567895");
    expect(blueMedium.color).toBe("Azul");
    expect(blueMedium.size).toBe("M");
    expect(blueMedium.offers).toMatchObject({
      price: "64.90",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${URL_PRODUTO}?cor=azul&tamanho=M`,
    });

    const soldOut = data.hasVariant.find((variant) => variant.sku === "CAM-PRETO-P")!;
    expect(soldOut.offers.availability).toBe("https://schema.org/OutOfStock");
    expect(soldOut.gtin).toBeUndefined();
  });

  it("usa Product simples para a variação única", () => {
    const data = productJsonLd(singleVariantFixture(), "https://loja.teste/produto/kit-meias");

    expect(data["@type"]).toBe("Product");
    expect(data).not.toHaveProperty("hasVariant");
    expect(data).toMatchObject({ sku: "MEI-KIT", url: "https://loja.teste/produto/kit-meias" });
  });

  it("numera a trilha de navegação a partir de 1", () => {
    const data = breadcrumbJsonLd([
      { name: "Início", url: "https://loja.teste/" },
      { name: "Camisetas", url: "https://loja.teste/categoria/camisetas" },
    ]) as { itemListElement: Array<{ position: number; name: string }> };

    expect(data.itemListElement.map((item) => [item.position, item.name])).toEqual([
      [1, "Início"],
      [2, "Camisetas"],
    ]);
  });
});
