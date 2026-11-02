---
name: MO Acessórios
description: Cada peça na sua cartela marfim da MO, apoiada numa vitrine rosé, brilhando como metal quando o olhar passa.
colors:
  vitrine: "#e9cfcb"
  vitrine-funda: "#d4b2ad"
  vitrine-tinta: "#1a1a17"
  vitrine-texto: "#5a4746"
  cartela: "#f4eee3"
  linha: "#d9d0c0"
  tinta: "#1a1a17"
  tinta-suave: "#5b574e"
  folha: "#9c7a3c"
  folha-vitrine: "#7e6128"
  grafite: "#2e2e2c"
  prata: "#c9cccf"
  alerta: "#8a2c1f"
typography:
  display:
    fontFamily: "Prata, Didot, Bodoni 72, serif"
    fontSize: "3.75rem"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Prata, Didot, Bodoni 72, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Prata, Didot, Bodoni 72, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.12
  price:
    fontFamily: "Prata, Didot, Bodoni 72, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  body:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  body-sm:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.16em"
  button:
    fontFamily: "Jost, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    letterSpacing: "0.18em"
rounded:
  cartela: "3px"
  etiqueta: "0.25rem"
  pill: "9999px"
spacing:
  gutter: "16px"
  cartela-pad: "12px"
  cartela-pad-destaque: "24px"
  grid-x: "24px"
  grid-y: "32px"
  container: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.cartela}"
    typography: "{typography.button}"
    rounded: "0px"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.grafite}"
    textColor: "{colors.cartela}"
  button-cartela:
    backgroundColor: "{colors.cartela}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "0px"
    padding: "0 24px"
    height: "44px"
  cartela:
    backgroundColor: "{colors.cartela}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.cartela}"
    padding: "12px 12px 16px"
  cartela-destaque:
    backgroundColor: "{colors.cartela}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.cartela}"
    padding: "24px"
  etiqueta:
    backgroundColor: "{colors.cartela}"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    padding: "6px 14px 6px 16px"
    height: "36px"
  etiqueta-ativa:
    backgroundColor: "{colors.folha-vitrine}"
    textColor: "{colors.cartela}"
  furo-numerado:
    textColor: "{colors.vitrine-tinta}"
    rounded: "{rounded.pill}"
    height: "44px"
    width: "44px"
  furo-numerado-marcado:
    backgroundColor: "{colors.cartela}"
    textColor: "{colors.tinta}"
  input-text:
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "0px"
    padding: "8px 0"
    height: "44px"
  falar-com-a-mo:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.cartela}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "10px 16px 10px 14px"
    height: "44px"
  pagina-atual:
    backgroundColor: "{colors.folha-vitrine}"
    textColor: "{colors.cartela}"
    height: "44px"
    width: "44px"
---

# Design System: MO Acessórios

## Overview

**Creative North Star: "Cartela na vitrine rosé"**

Toda semijoia de boutique chega numa cartela: o cartãozinho marfim com a marca. Na loja online, cada produto é uma cartela da MO apoiada numa vitrine rosé, e ela brilha como metal quando o olhar passa por ela. A identidade que a MO já tem (monograma "MO" em Didone, estrela dourada, marfim, o rosé e o dourado do Instagram) virou material: cartão marfim com "MO" impresso tom sobre tom no rodapé, sobre um fundo rosé com trama fraca de papel.

O mundo tem quatro tintas fixas (vitrine, cartela, folha e tinta), mais a cor de erro e o par grafite/prata reservado à linha masculina. A folha dourada é sinal de estado, não enfeite. A hierarquia vem só da escala de tipo: Prata (Didone de tela) para nomes, títulos e preço; Jost em caixa alta espaçada para a interface. A densidade é de vitrine de boutique: cartelas inteiras em fileiras, ar entre elas, sem selos empilhados.

A direção recusa o padrão da categoria: foto grande de modelo sobre creme, serifada e grade de cards brancos sem matéria. Nas telas de conta e no admin o mundo recua (modo Operate): marfim liso, títulos em Prata, tinta como cor de ação.

**Key Characteristics:**
- Vitrine rosé com trama de papel como fundo das páginas de loja; cartela marfim como superfície de produto e de leitura.
- A cartela se separa da vitrine pela sombra tingida de rosé, nunca por borda ou por contraste de cor (1,28:1 entre as duas).
- Folha dourada só no que está selecionado ou ativo; dourado nunca carrega texto sobre marfim.
- Ausência desenhada: esgotado é furo vazio ou número riscado, nunca some.
- Brilho de folha: a cartela inclina na direção do ponteiro e uma luz passa por ela; no toque, a luz passa com a rolagem.
- Formas retas: cartela com cantos de 3px, botões de canto vivo; só seletores e atendimento são pílulas.

## Colors

Rosé de vitrine e marfim de cartão, quase o mesmo valor, com tinta quase preta para todo texto e um dourado que só aparece para dizer "isto está escolhido".

### Primary
- **Folha dourada** (folha): o dourado da estrela e da folha de estado sobre a cartela. Indicador de foto atual na galeria, estrela do monograma, aro de foco/realce. Contraste 3,46:1 sobre a cartela: serve como indicador não textual (WCAG 1.4.11), nunca como texto.
- **Folha bronze** (folha-vitrine): a folha de estado sobre a vitrine rosé, onde o dourado claro some (2,71:1). Etiqueta da categoria atual, página atual da paginação, aro da opção marcada, fio de folha no hover da cartela, furo da etiqueta de filtro marcada. 3,93:1 sobre a vitrine; texto marfim em cima dela, 5,01:1.

### Secondary
- **Grafite** (grafite): hover do botão primário (marfim nele, 11,78:1) e superfície da cartela "Eles" (`.cartela-grafite`) e da etiqueta dessa coleção.
- **Prata** (prata): folha prateada da cartela "Eles" sobre grafite (8,44:1): texto secundário, furo da etiqueta e fio do hover. O tema vem da coleção (`cardTheme`).

### Tertiary
- **Alerta** (alerta): a única cor fora do mundo, decidida uma vez. Texto e borda de erro em campos e avisos (7,39:1 sobre a cartela). Sucesso usa tinta.

### Neutral
- **Vitrine rosé** (vitrine): fundo das vitrines (home, categoria, busca, produto, faixa de etiquetas), sempre com a trama de papel (ruído fractal a 6% de opacidade).
- **Rosé fundo** (vitrine-funda): barra fixa do polegar no celular, pontos das etiquetas, furos vazios da cartela vazia.
- **Marfim de cartela** (cartela): fundo do corpo (topo, rodapé, contas) e de toda cartela, etiqueta e furo marcado.
- **Linha** (linha): fios de topo/rodapé, divisórias, fundo das fotos ainda sem imagem, "MO" em relevo tom sobre tom (1,32:1, decorativo e fora da árvore de acessibilidade).
- **Tinta** (tinta) e **tinta da vitrine** (vitrine-tinta): todo texto principal; também o botão primário. 15,1:1 na cartela, 11,84:1 na vitrine, 8,95:1 no rosé fundo.
- **Tinta suave** (tinta-suave): texto secundário na cartela (6,23:1); na vitrine passa raspando (4,88:1), por isso a vitrine tem tom próprio.
- **Texto da vitrine** (vitrine-texto): texto secundário sobre a vitrine (5,88:1) e "a partir de" ao lado do preço.

#### Contraste conferido (WCAG 2.1, calculado a partir dos tokens)

| Par | Razão | Uso permitido |
|-----|-------|---------------|
| tinta / cartela | 15,10:1 | Texto |
| tinta / vitrine | 11,84:1 | Texto |
| tinta / vitrine-funda | 8,95:1 | Texto (barra do polegar) |
| tinta-suave / cartela | 6,23:1 | Texto secundário |
| tinta-suave / vitrine | 4,88:1 | Evitar; usar vitrine-texto |
| vitrine-texto / vitrine | 5,88:1 | Texto secundário |
| vitrine-texto / vitrine-funda | 4,44:1 | Só texto grande |
| cartela / tinta | 15,10:1 | Texto do botão primário |
| cartela / grafite | 11,78:1 | Hover do botão primário |
| cartela / folha-vitrine | 5,01:1 | Texto na etiqueta e página ativas |
| folha / cartela | 3,46:1 | Só indicador (sem texto) |
| folha-vitrine / vitrine | 3,93:1 | Só indicador (sem texto) |
| folha / vitrine | 2,71:1 | Proibido |
| alerta / cartela | 7,39:1 | Texto de erro |
| prata / grafite | 8,44:1 | Folha da cartela "Eles" |
| cartela / vitrine | 1,28:1 | Separação só pela sombra |

### Named Rules
**The Tintas Fixas Rule.** Só existem vitrine, cartela, folha e tinta, mais alerta e o par grafite/prata da linha masculina. Sem cinzas decorativos, sem gradientes de cor. A única gradiente do mundo é a luz branca do brilho de folha, que é reflexo, não cor.

**The Folha É Estado Rule.** A folha marca só o que está selecionado ou ativo: acabamento escolhido, categoria atual, página atual, foto atual. Nunca decora. A estrela do monograma é a marca da loja, não interface. Dourado nunca carrega texto sobre marfim; texto é sempre tinta, ou marfim sobre o bronze.

**The Folha Certa Rule.** Sobre a cartela, folha (#9c7a3c); sobre a vitrine, folha-vitrine (#7e6128). O dourado claro sobre o rosé não passa de 2,71:1.

## Typography

**Display Font:** Prata (com Didot, Bodoni 72, serif)
**Body Font:** Jost (com ui-sans-serif, system-ui, sans-serif)

**Character:** Prata é uma Didone desenhada para tela, que ecoa o monograma "MO" sem os traços finos que somem no fundo claro; Jost é a geométrica da interface, em caixa alta espaçada como o "ACESSÓRIOS" do logo. Ambas carregadas por next/font (self-hosted, sem CLS). Prata só existe no peso 400; o peso não é eixo de hierarquia.

### Hierarchy
- **Display** (Prata 400, 2rem no celular a 3.75rem do sm em diante, 1.02, -0.02em): o slogan da home. Um por página.
- **Headline** (Prata 400, 2.25rem a 3rem, 1.04, -0.02em): nome da peça na página de produto; títulos das telas de conta (2.25rem, 1.25) e de seção (1.875rem a 2.25rem).
- **Title** (Prata 400, 1.125rem, 1.12, até duas linhas): nome da peça na cartela. Na cartela da vez sobe para 1.875rem a 2.25rem; cabeçalhos do verso e da conta em 1.5rem a 1.875rem; lista "Escolha pela peça" em 1.25rem.
- **Preço** (Prata 400, 1.875rem, dígitos tabulares e alinhados): preço na página do produto e na cartela da vez, um degrau abaixo do nome. Nas cartelas pequenas o preço é Jost 500 0.875rem tabular.
- **Body** (Jost 400, 1rem, 1.625, máx. 65ch via max-w-prose): descrição e garantia no verso, campos. Texto auxiliar em 0.875rem.
- **Label** (Jost 500, 0.75rem, 0.16em, CAIXA ALTA): rótulos de campo, legendas de seletor, etiquetas, trilha. Botões em 0.875rem, 0.18em, caixa alta. O "ACESSÓRIOS" do monograma é 0.625rem, 0.32em.

### Named Rules
**The Hierarquia Por Escala Rule.** A hierarquia vem só do tamanho de Prata contra Jost. Nada de selos "NOVO", "-15%" ou "MAIS VENDIDO" sobre as cartelas, nem negrito para destacar nome.

**The Dígitos Tabulares Rule.** Preço, aro, comprimento, página e quantidade sempre com `tabular-nums lining-nums` (classe `numeros`).

**The Manuscrita Reservada Rule.** Letra manuscrita só na prévia da dedicatória de presente (ainda não construída); nunca em navegação nem em preço.

## Layout

Container único de 72rem com respiro lateral de 16px. As vitrines são faixas rosé de largura total; a cartela de leitura (corpo) é marfim. Sequência no topo: barra marfim fina (monograma, busca, conta) com fio de linha, depois a faixa de etiquetas sobre a vitrine.

- **Grade de cartelas:** 2 colunas no celular, 3 do sm (640px), 4 do lg (1024px); 3 no lg quando há coluna de filtros. Espaço horizontal 16px (24px do sm), vertical 32px (40px do lg). Reflui sempre em cartelas inteiras: a home pede 11 peças porque a cartela da vez ocupa duas casas e assim as fileiras fecham em 2, 3 e 4 colunas.
- **Cartela da vez:** ocupa duas colunas; do sm em diante vira larga (foto 55% de um lado, nome, preço e "Ver a peça" do outro, alinhados embaixo).
- **Listagem:** do lg, coluna de filtros de 17rem (uma cartela) ao lado da grade, com 40px de vão; no celular, a mesma cartela vira um painel recolhível "Filtrar e ordenar".
- **Produto:** do lg, duas colunas (1.1fr cartela da peça, 1fr compra) com 56px de vão; no celular, empilha e uma barra fixa em rosé fundo segura preço e WhatsApp sob o polegar.
- **Alvos de toque:** mínimo 44px (min-h-11) em todo link e controle; botões primários 48px.

## Elevation & Depth

A profundidade é de papel sobre papel: a cartela apoiada na vitrine projeta uma sombra curta tingida de rosé (nunca cinza), e é essa sombra, não uma borda, que separa marfim de rosé. Ao ser apontada, a cartela ganha o fio de folha bronze e uma sombra mais funda. Fora das cartelas o mundo é plano; o topo e o rodapé se separam por um fio de linha.

### Shadow Vocabulary
- **Cartela apoiada** (`box-shadow: 0 1px 2px rgb(74 40 44 / 0.14), 0 14px 26px -16px rgb(74 40 44 / 0.45)`): toda cartela, painel de filtros, cartela vazia e esqueleto.
- **Cartela realçada** (`box-shadow: 0 0 0 1px var(--color-folha-vitrine), 0 22px 36px -18px rgb(74 40 44 / 0.55)`): hover da cartela de produto; o foco usa o mesmo aro em outline de 2px.
- **Etiqueta** (`filter: drop-shadow(0 1px 1px rgb(74 40 44 / 0.25))`): sombra da etiqueta com ponta (drop-shadow, porque o clip-path cortaria box-shadow).
- **Aro de folha** (`box-shadow: 0 0 0 2px var(--color-vitrine), 0 0 0 4px var(--color-folha-vitrine)`): opção marcada na vitrine; na cartela, o mesmo aro com cartela e folha.
- **Furo** (`box-shadow: inset 0 1px 2px rgb(74 40 44 / 0.45)`): o furo vazio, cavado na cartela.

### Named Rules
**The Sombra Tingida Rule.** Toda sombra sobre a vitrine é tingida de rosé (rgb 74 40 44). Não remover a sombra da cartela: sem ela, marfim e rosé se fundem.

**The Uma Luz Só Rule.** Uma única luz no mundo: a das fotos (natural, lateral, sempre da mesma direção, guia de fotografia da spec 26 §7.2) e a luz do brilho de folha que passa pela cartela. Nenhuma outra fonte: sem brilho de fundo, sem gradiente de cor.

## Shapes

Formas de papelaria: retângulos de corte reto. A cartela tem cantos de 3px, como cartão cortado; botões, campos e casas da paginação são de canto vivo. A etiqueta tem uma ponta recortada à esquerda (polígono com entalhe de 0.625rem), com um furo redondo de 6px perto da ponta, como a etiqueta de preço amarrada. Pílulas só onde a peça pede círculo: seletores de acabamento e de aro (furos) e os botões de atendimento. Amostras de metal são círculos de 14px na cartela e 28px no seletor. Campos são uma linha de base, sem caixa.

**The Recorte Por Dentro Rule.** O recorte da etiqueta fica num elemento interno, para o anel de foco do link externo não ser cortado.

## Components

### Buttons
- **Shape:** canto vivo (0px).
- **Primário, cartão tinta:** fundo tinta, texto marfim, Jost 500 0.875rem em caixa alta a 0.18em, 48px de altura, 24px laterais; largura total nas telas de conta. Um por tela.
- **Hover / Focus:** fundo grafite por transição de cor; foco é contorno de 2px na cor do contexto (tinta na cartela, tinta da vitrine na vitrine), afastado 3px.
- **Cartão marfim:** fundo cartela, texto tinta, caixa alta a 0.16em, 44px; ação sobre a vitrine (404) e o "Adicionar à sacola" ainda desligado.
- **Texto:** ações secundárias ("Virar", "Limpar filtros") são texto sublinhado ou caixa alta com sublinhado no hover, 44px de alvo.

### Chips (etiquetas)
- **Style:** etiqueta marfim com ponta, texto tinta em caixa alta 0.75rem a 0.16em, furo rosé fundo de 6px, sombra de etiqueta. Na navegação de categorias ela fica sobre a vitrine, com rolagem horizontal sem barra.
- **State:** a etiqueta ativa (página atual) leva o bronze com texto marfim. Nos filtros a etiqueta é linha a 70% sobre a cartela; marcada vira tinta com texto marfim e o furo vira folha bronze.

### Cards / Containers
- **Corner Style:** 3px.
- **Background:** marfim de cartela sobre vitrine.
- **Shadow Strategy:** Cartela apoiada; Cartela realçada no hover (ver Elevation & Depth).
- **Border:** nenhuma.
- **Internal Padding:** 12px (16px embaixo) na cartela da grade; 16px no celular e 24px do sm na cartela da vez; 20px por 24px no painel de filtros.

### Inputs / Fields
- **Style:** linha de base de 1px em tinta a 40%, fundo transparente, texto 1rem, 44px; rótulo sempre visível em Label acima (nunca placeholder no lugar do rótulo).
- **Focus:** a linha vira tinta cheia e engrossa com uma sombra de 1px por baixo; sem anel em volta.
- **Error / Disabled:** linha e texto em alerta, mensagem em alerta 0.875rem ligada por aria-describedby. Avisos são caixas com borda de 1px: alerta para erro, tinta para sucesso, linha para informação.

### Navigation
- **Topo:** barra marfim com fio de linha; monograma "MO" em Prata 2rem com a estrela de folha, "ACESSÓRIOS" em 0.625rem a 0.32em; busca como campo de linha de base (só ícone no celular); link de conta.
- **Etiquetas de categoria:** faixa de vitrine logo abaixo do topo (ver Chips).
- **Trilha:** Label em caixa alta, separador "/" a 60%, links a 80% que sobem a 100% com sublinhado no hover.
- **Paginação:** casas de 44px; página atual em bronze com texto marfim, demais em marfim; "Anterior"/"Próxima" sublinhados.

### Cartela (componente assinatura)
O cartão de produto da loja. Foto 4:5 (quadrada na cartela da vez no celular), nome em Prata até duas linhas, "a partir de" em tom secundário e preço tabular, até cinco amostras de acabamento com "+N", e "MO" em Prata 0.75rem tom sobre tom no canto inferior direito. A cartela da vez traz o único botão "Ver a peça". Variantes: **esqueleto** (mesmo formato, blocos em linha a 60% pulsando, nunca spinner) e **cartela vazia** (dois furos vazios no alto e a mensagem em Prata: a vitrine vazia é a cartela da peça que não está ali).

### Brilho de folha
Envolve a cartela. Com ponteiro fino, a cartela inclina na direção do cursor (até 7° no eixo X e 9° no eixo Y, perspectiva de 900px; intensidade 0,35 na cartela grande do produto) e uma luz branca radial em soft-light, que segue o ponteiro, acende no hover e no foco. Só variáveis CSS mudam, sem re-render. Ao sair, tudo volta ao repouso.

### Cartela que vira
Na página do produto a cartela tem frente (galeria do acabamento escolhido, miniaturas com aro de folha na atual) e verso (detalhes, garantia; no fluxo de presente, a dedicatória). Gira em Y (perspectiva 1600px). O verso tem a altura da frente e rola por dentro. A face escondida fica `inert` e o foco acompanha a face visível.

### Seletores de acabamento e de aro
- **Acabamento:** pílula com amostra de 28px e o nome escrito (WCAG: nunca só a cor), borda tinta da vitrine a 30%. Marcada: fundo cartela com aro de folha bronze. Esgotado: a amostra vira **furo vazio** (círculo tracejado) e a palavra "esgotado" aparece.
- **Aro/comprimento (furos numerados):** círculos de 44px com o número tabular. Esgotado: borda tracejada e número riscado, anunciado como "esgotado". Inexistente na combinação: 40% de opacidade e desabilitado.

### Falar com a MO
Pílula tinta fixa no canto inferior direito, ícone de conversa e "Falar com a MO", que sobe 2px no hover. Abre o WhatsApp com mensagem pronta. Some na página do produto, onde a barra do polegar já traz o WhatsApp com o nome da peça.

### Movimento
- **Curva:** `--ease-solta` (cubic-bezier(0.16, 1, 0.3, 1)) para tudo.
- **Durações:** inclinação 400ms, sombra e luz 300ms, virar 700ms; ícones de abrir (+ gira 45°) e seta (avança 4px) 300ms.
- **Toque (hover: none):** sem inclinação. A luz atravessa a cartela uma vez quando ela entra na tela, levada pela rolagem (animação por `view()`, de entry 30% a cover 55%, da esquerda para a direita). Sem suporte a animação por rolagem, a luz não aparece.
- **Movimento reduzido:** a cartela não inclina e não gira (troca imediata de face); a luz continua, porque é só opacidade; no toque, a passagem vira um pulso de opacidade parado; o esqueleto não pulsa.

### Modo Operate: conta e admin
- **Conta (construída):** sem vitrine rosé. Corpo marfim liso, coluna estreita (28rem nas telas de entrada, 36rem em "Minha conta"), título em Prata 2.25rem, seções em Prata 1.5rem, um campo por linha com rótulo visível, botão primário em largura total, avisos com borda. A folha não aparece; tinta é a cor de ação. Pedidos, quando chegarem, entram como cartelas pequenas com status escrito.
- **Admin (ainda não construído):** herda o Operate da conta no mínimo: marfim, tinta como cor de ação, Jost para dados em tabelas densas com dígitos tabulares, filtros visíveis e ações por linha. A marca aparece só nos detalhes já existentes no vocabulário: esgotado como furo vazio e SKU em etiqueta. Densidade e velocidade antes de expressão; sem vitrine e sem brilho.

## Do's and Don'ts

### Do:
- **Do** apoiar toda cartela sobre a vitrine com a sombra tingida de rosé (`0 1px 2px rgb(74 40 44 / 0.14), 0 14px 26px -16px rgb(74 40 44 / 0.45)`).
- **Do** usar folha (#9c7a3c) sobre a cartela e folha-vitrine (#7e6128) sobre a vitrine, e só para selecionado, ativo ou atual.
- **Do** escrever texto em tinta; sobre a vitrine, secundário em vitrine-texto; sobre o bronze, marfim.
- **Do** desenhar a ausência: furo vazio tracejado para acabamento esgotado, número riscado para aro esgotado, cartela com dois furos para a vitrine vazia, sempre anunciados em texto.
- **Do** escrever o nome do acabamento ao lado de toda amostra de cor.
- **Do** manter a grade em cartelas inteiras e dígitos tabulares em todo número.
- **Do** manter um botão primário (cartão tinta) por tela.
- **Do** garantir 44px de alvo em todo controle e foco visível de 2px na cor do contexto.

### Don't:
- **Don't** pôr texto dourado sobre marfim, nem folha (#9c7a3c) sobre a vitrine (2,71:1).
- **Don't** usar a folha para decorar: sem fios dourados de enfeite, sem títulos dourados.
- **Don't** empilhar selos "NOVO", "-15%" ou "MAIS VENDIDO" nas cartelas; a hierarquia é só escala de tipo.
- **Don't** introduzir cinzas, brancos ou gradientes de cor fora das tintas fixas.
- **Don't** usar sombra cinza ou borda para separar a cartela da vitrine.
- **Don't** esconder variações esgotadas.
- **Don't** usar a vitrine rosé nem o brilho nas telas de conta, checkout em formulário e admin.
- **Don't** usar manuscrita fora da prévia da dedicatória.
