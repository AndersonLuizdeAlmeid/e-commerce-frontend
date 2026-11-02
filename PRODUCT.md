# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Cliente final, masculino e feminino.** Compra semijoias, acessórios e bolsas pelo celular, a partir do Instagram ou do Google. As duas ocasiões pesam parecido: **comprar para si** (peça do dia a dia) e **comprar presente** (datas comemorativas: Dia das Mães, Dia dos Pais, Dia dos Namorados, Natal).
- **Administradora da loja.** Pessoa da própria MO que cadastra produtos, fotos e estoque, separa e despacha pedidos. Usa o painel no computador e às vezes no celular, com leitor de código de barras (spec 20, D10).

## Product Purpose

Loja online própria da **MO Acessórios**, que hoje vende pelo direct do Instagram e pelo WhatsApp. O site leva o catálogo para fora do Instagram (SEO, Google Shopping), permite comprar sozinho com PIX ou cartão e frete dos Correios, e tira da conversa o trabalho manual de passar preço, frete e chave PIX.

Sucesso: o cliente encontra a peça, entende o acabamento e o tamanho, confia no preço e conclui a compra no celular sem precisar chamar ninguém, mas pode chamar se quiser.

## Positioning

Três coisas que a MO afirma e que uma loja genérica de semijoias não afirma juntas:

1. **Preço com cara de joia.** Visual de joia fina por preço de semijoia.
2. **Atendimento próximo.** Curadoria pessoal, ajuda a escolher presente, conversa de verdade no WhatsApp.
3. **Masculino + feminino.** A linha masculina ("Eles") é tratada como linha própria, e não como apêndice.

## Operating Context

- Canal atual: Instagram [@momodaeacessorios](https://www.instagram.com/momodaeacessorios/) (~450 seguidores em 10/2026) e WhatsApp `wa.me/5551997553649`. "Pedidos no direct" é o hábito dos clientes de hoje.
- Destaques do Instagram mostram as categorias reais: Pulseiras, Anéis, Colares, Brincos, Bolsas, Prata 925, Eles (masculino), Ensaios, Feedback.
- O calendário comercial é feito de datas comemorativas e promoções mensais (ex.: "Promoção do mês de Setembro: colar + pulseira = 15% off").
- Volume inicial baixo (~10 pedidos/semana, spec 20, D09).

## Capabilities and Constraints

- Stack e arquitetura já decididas no backend (`e-commerce-backend/specs/16-frontend-react.md`): Next.js App Router, TypeScript, Tailwind, Radix headless, SSR por SEO, compra só com conta, pagamento PIX e cartão, frete Correios.
- **Variações genéricas.** O modelo do backend continua `cor × tamanho`, de propósito genérico para a loja poder vender roupas no futuro. Hoje: semijoias (cor = banho/acabamento: dourado, prateado, ródio, prata 925; tamanho = aro do anel ou comprimento da corrente), bolsas (cor e tamanho reais) e acessórios. **A tela usa os rótulos da categoria** em vez de "cor" e "tamanho" literais; os rótulos ficam no cadastro da categoria (spec 26, ADR-F07).
- **Coleções** atravessam categorias: "Eles" (masculino) e "Prata 925" são coleções, não categorias (spec 26, ADR-F08).
- O pedido aceita **embalagem para presente** e **dedicatória** (spec 26, RF-047).
- Fora de escopo da v1 (spec 00): cupons e promoções automáticas, avaliações, newsletter. As promoções do Instagram continuam manuais.
- Moeda única BRL, idioma pt-BR.

## Brand Commitments

- Nome: **MO Acessórios** (Instagram "MOmodaeacessórios"). Slogan em uso: **"Estilo que completa você"**. Bio: "A escolha certa para seu estilo".
- Logo existente: monograma "MO" em serifada de alto contraste, estrela de 4 pontas dourada, "ACESSÓRIOS" em caixa alta espaçada dourada e o slogan em versalete miúdo, sobre fundo marfim. **O arquivo vetorial do logo ainda precisa ser entregue pela loja.**
- Voz nas legendas: calorosa, próxima, com emoji ("Um bom acessório muda tudo", "Amor que inspira, estilo que fica").

## Evidence on Hand

- **Fotos profissionais existem** (confirmado pela loja): ensaios com modelo, peças na mão e no corpo, flat lays sobre linho com flores secas e o saquinho de juta da marca. Ainda não estão no repositório; precisam ser enviadas.
- Feedbacks de clientes existem como destaque do Instagram, mas **não foram fornecidos**. O site não deve inventar depoimentos, número de clientes vendidos ou selos de garantia que a loja não tenha confirmado.
- **Garantia do banho: até 6 meses, com uso correto pelo cliente** (confirmado pela loja em 29/10/2026). O que conta como "uso correto" ainda não foi definido. Certificado da prata 925: não confirmado.
- Desconto no PIX e preço da embalagem para presente: **não decididos**. Não anunciar.

## Product Principles

1. **A peça é a protagonista.** A interface existe para fazer a semijoia parecer o que ela é: algo bonito de usar e de dar.
2. **Comprar sozinho, mas nunca sozinho.** O checkout funciona sem ajuda e o WhatsApp está sempre a um toque, sem atrapalhar a compra.
3. **Presente é um caminho de primeira classe**, não um campo escondido no checkout.
4. **Masculino tem a mesma dignidade.** Navegação, fotos e textos não tratam "Eles" como exceção.
5. **Celular primeiro.** O cliente chega do Instagram, então cada tela é pensada para o polegar antes do mouse.

## Accessibility & Inclusion

WCAG 2.1 AA (spec 16 §8). Acabamento e tamanho sempre anunciados por texto, nunca só pela bolinha de cor. Contraste do dourado sobre marfim precisa ser verificado: dourado claro não pode carregar texto.
