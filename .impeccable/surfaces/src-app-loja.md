---
version: 1
slug: "src-app-loja"
primary_target: "src/app/(loja)"
related_targets: ["src/app/layout.tsx","src/app/(conta)"]
---

# Loja (vitrine pública) — MO Acessórios

Escopo: home, categoria, coleção, produto, busca, 404 e as telas de conta. Modo **Persuade** nas páginas de vitrine e **Operate** nas de conta (spec 26 §3).

Público: cliente masculino e feminino, no celular, vindo do Instagram ou do Google, comprando para si ou para presente. Ação: escolher acabamento e tamanho e adicionar à sacola. Nada de depoimentos, selos ou garantias inventados (PRODUCT.md).

Histórico: em 29/10/2026 a cliente escolheu, por comparação na loja, rosé claro, cartela marfim com brilho de folha, Prata e texto preto. Em 11/11/2026 o dono rejeitou a home feita nesse mundo ("não sinto vontade de estar no site", botões simples demais, o cartão da peça não agrada, faltou impacto) e fixou o mundo da prévia `mo-acessorios/versao-a5`, que as clientes aprovaram, com a abertura "peça em cena + prateleiras". Inovações pedidas para o dia a dia: comprar virando a peça na própria grade, medidor de aro na tela e guia do colar. Kits por orçamento e painel lateral foram rejeitados.

Decisões ainda abertas: logo SVG (monograma provisório em texto), fotos reais das peças (o ambiente local usa fotos de teste do Unsplash, as mesmas da A5), desconto PIX, DESIGN.md (ainda descreve o mundo anterior; reescrever depois que o dono aprovar esta versão rodando).

## Direction contract

THESIS: A loja é a vitrine da A5 vendendo: cada peça fica sob a luz numa moldura de passe-partout pérola sobre cetim champanhe, e se compra ali mesmo, virando a moldura. Recusa o padrão da categoria: grade de cards brancos com botão retangular e banner de promoção.

OWN-WORLD: Cetim blush/champanhe (#F3E6DC) com grão fino e reflexos grandes e suaves; faixas nude (#E8D3C5); pérola (#FAF3EE) para molduras e superfícies elevadas; tinta preta suave (#1E1A18); ouro só como fio e luz (#C9A26B), ouro-tinta (#6E5029) para links e detalhes de texto. Moldura da peça: foto 4:5, passe-partout pérola de 5px, fio de ouro de 1px, sombra marrom quente longa; ao apontar, a foto aproxima, uma luz quente acende e o fio vira ouro cheio. Botões em pílula: tinta com fio de ouro por dentro e sombra quente (principal), fio de ouro sobre pérola translúcida (secundário), círculos de 44px para controles. Prata para títulos, nomes e preços; Jost para a interface. Linha "Eles": moldura grafite com fio prata.

STORY: A cliente chega do Instagram, vê uma peça em cena com preço e botão de comprar, desliza as prateleiras por linha, vira a peça que gostou e escolhe banho e aro sem sair dali; se não sabe o aro, mede na tela; se é colar, vê onde cada comprimento cai.

FIRST VIEWPORT: Topo pérola fino (monograma, busca, conta, sacola) e a linha de categorias. Abaixo, a peça em cena: no desktop a foto ocupa a metade direita e se dissolve no cetim à esquerda, onde ficam o slogan em Prata grande, o nome da peça, o preço e "Adicionar à sacola" em pílula tinta; as peças em cena se revezam com fusão lenta, com pausa. No celular a foto vem em cima, dissolvendo para baixo, e o texto com o botão logo abaixo. A borda da primeira prateleira já aparece.

FORM: Vitrine da A5 como loja (peça em cena + prateleiras deslizantes). seed: none (pinned) — "Os meus clientes gostaram de algumas ideias que estão aí, do carrossel e tudo mais" (sobre versao-a5) e a escolha "Peça em cena + prateleiras" na pergunta de 11/11/2026.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
