# Q&A Laudofy

> Nome interno do repositório/pacotes (`qea-laudofy`) mantido por conveniência
> técnica — o nome do produto é **Q&A Laudofy** (a marca é "Q&A", não "QEA").

Sistema interno da imobiliária para os corretores (~15) cadastrarem imóveis,
gerarem o laudo (Ficha de Imóvel) automaticamente a partir de um template
`.docx` real, e organizarem as fotos por ambiente com apoio de classificação
por IA visual.

Não é um SaaS multi-empresa: existe uma única imobiliária, dois papéis
(`admin` e `corretor`). As tabelas principais carregam `organization_id`
apontando para uma única linha em `organizations`, só para não fechar a porta
de uma eventual evolução futura — nenhuma lógica de isolamento entre
organizações é implementada agora.

## Stack

- **Frontend** (`apps/web`, a construir): React + Vite + TypeScript + Tailwind
  + shadcn/ui, `react-hook-form` + `zod`, `dnd-kit` para reordenar fotos,
  cliente Supabase (auth/storage/realtime).
- **Backend** (`apps/api`, a construir): Node.js + TypeScript + Fastify,
  `docxtemplater`/`pizzip` ou o pipeline Python equivalente (ver nota abaixo)
  para gerar o `.docx`, LibreOffice headless para converter em PDF, `pg-boss`
  como fila assíncrona (roda sobre o próprio Postgres do Supabase, sem Redis),
  Anthropic SDK para a classificação visual das fotos.
- **Dados/infra**: Supabase (Postgres + Auth + Storage + Realtime). Backend
  roda como um serviço Docker único (Railway/Fly.io) que precisa ficar de pé
  continuamente pro worker da fila e ter LibreOffice instalado.
- **Monorepo**: npm workspaces (`apps/*`, `packages/*`). Optamos por npm em vez
  de pnpm porque o ambiente de desenvolvimento não tinha Homebrew/sudo
  disponível para instalar o pnpm via corepack — sem diferença prática para
  este projeto.

## Decisões de escopo (confirmadas com a equipe)

- Sem multi-tenancy, sem planos, sem onboarding de novas imobiliárias.
- Dois papéis apenas: `admin` (vê/gerencia tudo) e `corretor` (vê/gerencia só
  os próprios imóveis).
- Campos de rotina interna da ficha original (assinaturas/código UN de
  roteamento, Captação/Habite-se/Documentação na empresa/Em Obra/Opcionista/
  Comissão, log de atualizações no rodapé) **ficam fora do MVP** — a equipe
  confirmou que nunca são preenchidos na prática. No template `.docx` essas
  seções permanecem como controles nativos do Word, em branco, intocados.
- Laudo gerado sempre a partir do `.docx` (fonte da verdade); o corretor
  escolhe baixar em DOCX ou PDF.
- Dados factuais do laudo (endereço, metragem, valores etc.) vêm só do
  formulário, nunca de IA generativa. A descrição de marketing por IA
  (`descricao_marketing_ia`) foi removida a pedido da equipe — a descrição
  do laudo segue o modelo real deles: `descricao_titulo` (frase em
  negrito/maiúsculo) + a frase fixa "O imóvel vem descrito da seguinte
  forma:" (fixa, não é um campo) + `descricao` (corpo, onde qualquer linha
  "Rótulo:" vira negrito automático no laudo gerado). O aviso de direitos
  autorais que aparece no site deles é gerado pelo site, não pelo laudo —
  nunca reproduzido aqui.
- Tipo de imóvel: seleção única entre `apartamento/casa/cobertura/sitio/
  terreno`, EXCETO quando é `comercial/loja/sala`, caso em que pode combinar
  mais de um desses três (regra aplicada via `CHECK` constraint no banco).
- Campo "Nº/Pav." da ficha original: confirmado pela equipe como **uso livre
  de cada corretor**, sem significado fixo — mantido como texto livre
  (`properties.andar`), sem tipagem ou regra de negócio associada.
- "Canto de pedra": campo próprio da imobiliária, mantido como está
  (`properties.canto_de_pedra`, boolean) — é o primeiro campo do formulário
  de cadastro (pedido explícito da equipe).
- "Planta original" (quartos/suítes conforme a planta registrada) mantido
  separado da contagem atual, para os casos em que houve reforma/ampliação.
- Categorias de foto (`photo_categories`) ficam em tabela, não em enum nativo
  do Postgres, justamente para permitir reordenar/ajustar a taxonomia depois
  sem precisar de migration. Taxonomia atual (28 ambientes, nessa ordem):
  Fachada, Fachada Secundária, Garagem, Área Gourmet, Área de Lazer, Sauna,
  Quintal, Sala, Sala de Jantar, Sala de TV, Área de Convivência, Cozinha,
  Área de Serviço, Varanda, Quarto, Suíte, Suíte Master, Banheiro, Banheiro
  da Suíte, Lavabo, Banheiro da Suíte Master, Closet da Suíte, Closet da
  Suíte Master, Piscina, Churrasqueira, Academia, Hall, Hall 2º Pavimento.
- Numeração das fotos na tela de revisão segue sempre o formato
  `N - Ambiente` (ex: "1 - Sala", "2 - Sala"), nunca "Sala 1".
- `property_photos.final_category` não tem mais FK fixa para
  `photo_categories` (só `ai_suggested_category` tem, pois é sempre uma das
  categorias que mandamos pra IA escolher) — o corretor pode digitar um nome
  de ambiente livre na revisão quando a lista não cobrir o caso.
- `properties.agendamento_necessario` (boolean): gap encontrado ao implementar
  a geração do laudo — a ficha original tem um checkbox "Agendar: Sim/Não"
  separado da observação de agendamento, que faltava no schema original (só
  tínhamos capturado o texto da observação).
- Cadastro de corretores é feito pelo admin dentro do próprio app
  (`/admin/users`), não mais só pelo painel do Supabase — usa a Admin API do
  Supabase Auth (`supabaseAdmin.auth.admin.createUser`), só acessível pelo
  backend (precisa da service role key).
- Locação tem valor próprio (`valor_locacao`) além do "valor do imóvel"
  (`valor`, sempre presente independente da finalidade) — pedido da equipe
  após revisar o formulário.
- No laudo gerado, quando o imóvel também é pra locação, o campo "Motivo da
  venda" recebe automaticamente o texto **"LOCAÇÃO: (R$ valor) + Taxas" em
  vermelho/negrito**, antes do texto normal digitado pelo corretor. Por isso
  esse campo do template usa `docxtpl.RichText` (`{{r motivo_venda}}`) em vez
  de texto simples — é o único campo do template que precisa disso hoje.
- "Data de entrega" tem 3 modos: a combinar / imediata / data — quando é
  "data", o corretor só informa mês+ano ou só ano (nunca o dia), por isso
  virou `data_entrega_tipo` + `data_entrega_mes` + `data_entrega_ano` em vez
  de uma coluna `date` única.
- CEP, telefone e e-mail têm validação de formato no formulário (regex). CEP
  também dispara uma busca automática na API pública do ViaCEP para
  pré-preencher endereço/bairro (o corretor pode sempre corrigir depois).
- Campos monetários (`valor`, `valor_locacao`, `condominio_valor`,
  `iptu_valor`) usam um input mascarado em R$ com centavos
  (`CurrencyField`), não um `<input type="number">` simples.

## Módulo 1 — Template do laudo

O modelo real (`LAUDO DIGITAL 2025.docx`) é, na prática, uma **Ficha de
Imóvel** de uso interno (não um laudo formatado para cliente): 1 página A4,
sem logo, construída com **content controls nativos do Word** (66 checkboxes,
8 dropdowns/comboBox, 1 date picker), nenhum com `tag`/`alias` — o mapeamento
de cada campo é posicional (documentado em `templates/laudo/`).

`templates/laudo/ficha_imovel.template.docx` é o template com as tags Jinja
(`{{ campo }}`) no lugar de cada controle/campo em branco, gerado
programaticamente a partir do original (não editado à mão no Word) para
preservar 100% a formatação. `templates/laudo/exemplo_renderizado.docx` é uma
renderização de exemplo com dados fictícios, usada para validação visual com
a equipe.

**Armadilha encontrada e corrigida**: os controles de dropdown/data do Word
usam o estilo de caractere nativo `TextodoEspaçoReservado` ("Placeholder
Text": cinza, fonte menor) no texto de instrução ("Escolher um item.",
"Clique para inserir uma data."). Ao desembrulhar o `w:sdt` preservando o
`rPr` original, esse estilo vazava para o valor final. Corrigido copiando o
`rPr` do rótulo imediatamente anterior (removendo negrito) para esses 9
campos (a data + os 8 dropdowns) — checkboxes não têm esse problema, pois o
glifo ☐/☒ já usa a formatação de conteúdo real, não de placeholder.

**Decisão de arquitetura**: a geração do laudo ficou em Python (`docxtpl`),
chamado pelo backend Node (`apps/api`) como subprocesso
(`src/report/renderDocx.ts` → `templates/laudo/scripts/render_report.py`),
em vez de reescrever em `docxtemplater`/Node. Motivo: o `docxtpl` tem suporte
nativo a `RichText` (texto colorido dentro de um campo), necessário pro aviso
de locação em vermelho no "Motivo da venda" — reescrever isso em Node exigiria
manipulação manual de XML equivalente ao que já foi validado em Python. O
mapeamento dos dados do imóvel pros ~108 campos do template (checkboxes,
formatação de valores/datas) fica em TypeScript
(`apps/api/src/report/buildContext.ts`), só a mecânica de preencher o `.docx`
é Python — mantém a lógica de negócio tipada e testável no mesmo lugar que o
resto do backend.

## Banco de dados

Schema em `supabase/migrations/`: `organizations` (seed único) → `profiles`
(espelha `auth.users`) → `properties` → `property_photos` /
`photo_upload_batches` → `reports`, mais `photo_categories` (taxonomia
configurável). RLS por linha: corretor vê/gerencia só os próprios imóveis
(`broker_id = auth.uid()`), admin vê/gerencia tudo (`public.is_admin()`,
função `SECURITY DEFINER` para evitar recursão de RLS).

Bucket de storage `property-files`, convenção de path
`<property_id>/photos/...` e `<property_id>/reports/...`, com políticas
espelhando as mesmas regras de acesso das tabelas.

Migrations aplicadas e testadas contra o projeto Supabase real via
`supabase db push` (`20260905000000_init_schema.sql` e
`20260906000000_property_pricing_and_delivery.sql`), sem erros.

## Como aplicar uma migration nova

Com o [Supabase CLI](https://supabase.com/docs/guides/cli) instalado (via
`npm install supabase --save-dev` na raiz, já feito) e o projeto linkado
(`npx supabase link --project-ref <ref>`, já feito neste projeto):

```bash
npx supabase db push
```

Alternativa sem CLI: copiar o conteúdo do arquivo de migration mais recente
em `supabase/migrations/` e colar no SQL Editor do painel do Supabase.

## Deploy

- **Frontend (Vercel)**: projeto `qe-a-company/web`, linkado na raiz do
  monorepo (`.vercel/` na raiz, não em `apps/web`). `vercel.json` na raiz
  define `installCommand`/`buildCommand`/`outputDirectory` pra resolver os
  workspaces do npm (rodar `vercel deploy` de dentro de `apps/web` não
  funciona - o `@qea-laudofy/shared` não é resolvido). Redeploy:
  ```bash
  npx vercel deploy --prod --yes   # a partir da raiz do repo
  ```
  Variáveis (`vercel env add <NOME> production --value "..."`, redeploy pra
  aplicar): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`
  (hoje ainda aponta pra `http://localhost:3333` - **atualizar assim que o
  backend estiver na Railway**, redeploy depois de mudar).

- **Backend (Railway)**: **pendente** — `npx railway init` falhou porque o
  trial da conta expirou ("Your trial has expired. Please select a plan to
  continue using Railway"). Assim que escolherem um plano no painel
  (railway.com), rodar a partir da raiz do repo:
  ```bash
  npx railway init --name qea-laudofy-api   # cria o projeto
  npx railway variable set SUPABASE_URL=... --service <service>
  npx railway variable set SUPABASE_SERVICE_ROLE_KEY=... --service <service>
  npx railway variable set SUPABASE_DB_URL=... --service <service>
  npx railway variable set ANTHROPIC_API_KEY=... --service <service>
  npx railway variable set CORS_ORIGIN=https://web-omega-drab-89.vercel.app --service <service>
  npx railway up --detach
  npx railway domain   # gera a URL pública
  ```
  `railway.json` na raiz já aponta pro `apps/api/Dockerfile` (build context é
  a raiz do repo, por causa do monorepo). Depois de ter a URL da Railway,
  atualizar `VITE_API_URL` na Vercel e redeployar o frontend.

## Como rodar localmente

```bash
npm install                       # na raiz, instala tudo (workspaces)

# apps/web/.env.local (copiar de .env.example e preencher com a anon/publishable key)
cd apps/web && npm run dev        # http://localhost:5173

# apps/api/.env (copiar de .env.example - service role key, connection string do DB)
cd apps/api && npm run dev        # http://localhost:3333/health
```

`apps/api` precisa de Python 3 com `docxtpl`/`lxml` instalados no PATH (usa
`python3` via subprocesso pra gerar o laudo — ver
`templates/laudo/scripts/requirements.txt`) e, opcionalmente, `soffice`
(LibreOffice) pra conversão em PDF — sem ele, o laudo ainda é gerado em DOCX,
só o PDF fica indisponível.

## Status

- [x] Análise do modelo real do laudo e mapeamento de campos
- [x] Template `.docx` com placeholders + validação visual com a equipe
- [x] Schema SQL + RLS aplicado e testado contra o projeto Supabase real
      (`supabase db push`, sem erros)
- [x] Scaffold de `apps/web` (Vite+React+TS+Tailwind v4) e `apps/api`
      (Fastify+TS), com `packages/shared` compartilhando os types do banco
      gerados via `supabase gen types typescript`
- [x] Autenticação (Supabase Auth, e-mail+senha) — login, `AuthContext`,
      rota protegida, testado ponta a ponta num usuário real
- [x] Formulário de cadastro de imóvel — wizard em 6 etapas, CEP autocompleta
      via ViaCEP, valores monetários mascarados, validação de telefone/e-mail/
      CEP, regra de negócio de tipo/locação
- [x] Upload de fotos (drag-and-drop) + fila assíncrona (pg-boss) + classificador
      plugável (mock hoje, `ClaudeVisionProvider` já escrito mas não testado -
      troca é definir `ANTHROPIC_API_KEY`), testado ponta a ponta
- [x] Tela de revisão de fotos — agrupamento por categoria com numeração
      contínua no imóvel inteiro ("1 - Sala", "2 - Sala", "3 - Fachada"...),
      aceitar todas as sugestões em lote, editar categoria via dropdown (ou
      digitar um nome de ambiente livre), reordenar por drag-and-drop
      (`dnd-kit`), destaque configurável de baixa confiança. Taxonomia com 28
      ambientes (ver seção "Decisões de escopo" acima).
- [x] Geração de laudo — endpoint `POST /properties/:id/reports` monta o
      contexto a partir dos dados reais do imóvel, gera o `.docx` (via
      subprocesso Python/docxtpl) e tenta converter pra PDF (LibreOffice
      headless); retorna links assinados de download. Testado ponta a ponta
      com um imóvel real cadastrado pela equipe. Conversão pra PDF não pôde
      ser testada localmente (sem LibreOffice no ambiente de dev) — só a
      geração do DOCX foi validada aqui; o Dockerfile de produção já instala
      LibreOffice, mas o build da imagem também não foi testado (sem Docker
      disponível no ambiente de desenvolvimento).
- [x] Cadastro de corretores pelo admin — tela `/admin/users` (só visível pra
      quem é admin), cria/edita/exclui o usuário via Admin API do Supabase
      Auth (`/admin/users` no backend, exige a service role key). Exclusão
      bloqueada com erro claro se o corretor ainda tiver imóveis (evita
      deixar imóvel órfão — precisa excluir/reatribuir os imóveis antes).
- [x] ~~Descrição de marketing por IA~~ — removida a pedido da equipe (ver
      "Decisões de escopo" acima). A descrição do laudo agora é sempre
      digitada pelo corretor, no formato real deles (título + rótulos em
      negrito automático).
- [x] Excluir laudo gerado — `DELETE /reports/:id` (remove do banco e do
      storage), com confirmação inline na UI antes de excluir.
- [x] Excluir imóvel inteiro — na página do imóvel, com confirmação inline;
      limpa fotos/laudos do storage antes de excluir a linha (o resto —
      property_photos, photo_upload_batches, reports — cai em cascata via FK).
- [x] Status do imóvel virou o fluxo de trabalho real pedido pela equipe:
      `pendente` → `finalizado` → `publicado` (substituiu o enum anterior
      rascunho/ativo/inativo/vendido/alugado, que nunca tinha sido exposto na
      UI). Editável na página do imóvel; filtros por status no Dashboard.
- [ ] Heurística de agrupamento por timestamp/sequência (hoje o agrupamento é
      só por categoria; ligar fotos da "mesma suíte" ainda é manual via dropdown)
- [x] Chave da Anthropic configurada e testada de verdade — classificação de
      fotos por IA usa a Claude real (não mais mock)
- [~] Deploy — **frontend em produção na Vercel**:
      https://web-omega-drab-89.vercel.app (deploy via `vercel deploy --prod`
      a partir da raiz do monorepo, com `vercel.json` configurando
      install/build/output pra resolver os workspaces — a equipe assume o
      deploy manual na Vercel daqui pra frente, conectado ao GitHub). Domínio
      próprio planejado: `laudofy.qeacompany.com.br`. **Backend na Railway
      bloqueado**: o trial da conta expirou, precisa escolher um plano pago
      no painel da Railway antes de eu conseguir rodar `railway up`. Até lá,
      o frontend publicado funciona só pra login/cadastro/fotos (que falam
      direto com o Supabase) — geração de laudo, classificação por IA e
      cadastro de corretor (que passam pelo backend) não funcionam no site
      publicado ainda, só localmente.
- Repositório movido para a conta corporativa:
      https://github.com/Q-A-Company/qea-laudofy
