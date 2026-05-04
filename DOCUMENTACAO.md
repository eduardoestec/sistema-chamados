# Sistema de Chamados — A.S 
## Documentação Técnica

---

## Visão Geral do Sistema

Sistema web de abertura e acompanhamento de chamados de manutenção predial.

**Problema que resolve:** funcionários encontram problemas em salas/ambientes (lâmpada queimada, vazamento, etc.) e precisam de um canal simples para reportar. Sem necessidade de login, app instalado ou treinamento — basta escanear o QR Code afixado no ambiente.

**Principais funcionalidades:**
- Abertura de chamados via QR Code (sem login)
- Acompanhamento público por código (ex: MAT-12345)
- Painel administrativo protegido para gerenciar e atualizar chamados
- Geração e impressão de QR Codes por sala
- Relatórios com gráficos por tipo, status e urgência
- Exportação de chamados em CSV

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  /sala/token │  │ /novo-chamado│  │    /admin/*      │  │
│  │  (QR Code)   │  │  (Formulário)│  │ (Painel Admin)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                   │             │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │                 │                   │
          │         ┌───────┴──────┐            │
          │         │  Next.js     │            │
          │         │  Middleware  │◄───────────┘
          │         │  (auth check)│
          │         └───────┬──────┘
          │                 │
┌─────────┼─────────────────┼─────────────────────────────────┐
│         │   NEXT.JS SERVER│                                  │
│         │                 │                                  │
│  ┌──────▼──────┐  ┌───────▼───────┐  ┌───────────────────┐  │
│  │ Server Pages│  │  API Routes   │  │  Admin Pages      │  │
│  │ /sala/[tok] │  │ POST /api/    │  │  (SSR + client)   │  │
│  │ (SSR)       │  │ chamados      │  │                   │  │
│  └─────────────┘  │ GET /api/     │  └─────────┬─────────┘  │
│                   │ chamados/[cod]│            │             │
│                   └───────┬───────┘            │             │
│                           │                    │             │
└───────────────────────────┼────────────────────┼─────────────┘
                            │                    │
                    ┌───────▼────────────────────▼───────┐
                    │           SUPABASE                  │
                    │                                     │
                    │  ┌─────────────┐  ┌─────────────┐  │
                    │  │  PostgreSQL │  │  Auth       │  │
                    │  │  (dados)    │  │  (admins)   │  │
                    │  └─────────────┘  └─────────────┘  │
                    └─────────────────────────────────────┘
```

---

## Stack Tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16.2.1 | Framework fullstack (SSR, API routes, middleware) |
| React | 19.2.4 | UI components |
| TypeScript | ^5 | Tipagem estática |
| Tailwind CSS | ^4 | Estilização utility-first |
| Supabase | (via node_modules raiz) | Backend as a Service (banco + auth) |
| @supabase/ssr | (via node_modules raiz) | Integração Supabase com SSR/middleware |
| @supabase/supabase-js | (via node_modules raiz) | Client Supabase para browser |
| Recharts | (via node_modules raiz) | Gráficos na página de relatórios |
| qrcode | ^1.5.4 | Geração de QR Codes em canvas |
| lucide-react | (via node_modules raiz) | Ícones |

> **Nota:** os `node_modules` ficam na pasta raiz `sistema-chamados-main/` e são compartilhados
> com o projeto `sistema-chamados/` via resolução de módulos do Node.js.

---

## Estrutura de Pastas

```
sistema-chamados-main/
├── DOCUMENTACAO.md              ← este arquivo
├── node_modules/                ← dependências instaladas (raiz)
└── sistema-chamados/            ← projeto Next.js
    ├── app/
    │   ├── layout.tsx           ← layout raiz (fontes, metadata)
    │   ├── page.tsx             ← página inicial (redireciona ou exibe home)
    │   ├── acompanhar/
    │   │   └── page.tsx         ← busca chamado por código (página pública)
    │   ├── confirmacao/
    │   │   └── page.tsx         ← exibe código após criar chamado
    │   ├── novo-chamado/
    │   │   ├── page.tsx         ← wrapper com Suspense para o formulário
    │   │   └── FormularioChamado.tsx ← formulário de abertura de chamado
    │   ├── sala/
    │   │   └── [token]/
    │   │       └── page.tsx     ← landing page do QR Code de cada sala
    │   ├── admin/
    │   │   ├── login/
    │   │   │   └── page.tsx     ← login do painel admin
    │   │   ├── page.tsx         ← listagem de chamados (painel principal)
    │   │   ├── chamado/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx ← detalhe + atualização de um chamado
    │   │   ├── relatorios/
    │   │   │   └── page.tsx     ← gráficos e exportação CSV
    │   │   └── qrcodes/
    │   │       └── page.tsx     ← geração e impressão de QR Codes
    │   └── api/
    │       └── chamados/
    │           ├── route.ts     ← POST /api/chamados (criar chamado)
    │           └── [codigo]/
    │               └── route.ts ← GET /api/chamados/[codigo] (acompanhar)
    ├── lib/
    │   ├── supabase.ts          ← client Supabase para componentes client-side
    │   ├── supabase-server.ts   ← factory de client por request (API routes)
    │   ├── rate-limit.ts        ← rate limiter em memória por IP
    │   └── types.ts             ← interfaces TypeScript (Chamado, Historico)
    ├── middleware.ts             ← proteção server-side das rotas /admin
    ├── next.config.ts           ← configuração Next.js + headers de segurança
    ├── package.json
    └── tsconfig.json
```

---

## Banco de Dados

O banco é gerenciado pelo Supabase (PostgreSQL). Abaixo o schema inferido do código.

### Tabela: `chamados`

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | uuid | NÃO | Chave primária, gerada pelo Supabase |
| `codigo_unico` | text | NÃO | Código público de acompanhamento (ex: MAT-12345) — UNIQUE |
| `tipo_problema` | text | NÃO | Categoria: Eletrica, Hidraulica, Iluminacao, Mobiliario, Equipamentos, Infraestrutura, Outros |
| `descricao` | text | NÃO | Descrição detalhada (máx. 500 caracteres) |
| `urgencia` | text | NÃO | Enum: baixa, media, alta, muito_alta |
| `status` | text | NÃO | Enum: enviado, recebido, em_analise, em_andamento, resolvido |
| `sala_id` | uuid | SIM | FK → tabela salas (atualmente sempre null) |
| `criado_em` | timestamptz | NÃO | Data/hora de criação |
| `atualizado_em` | timestamptz | SIM | Última atualização pelo admin |
| `previsao_resolucao` | timestamptz | SIM | Estimativa de resolução |
| `responsavel_id` | uuid | SIM | FK → auth.users (admin responsável) |

### Tabela: `chamado_historico`

Registra cada mudança de status. Forma a linha do tempo exibida ao usuário.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | uuid | NÃO | Chave primária |
| `chamado_id` | uuid | NÃO | FK → chamados.id |
| `status_anterior` | text | SIM | null apenas na criação inicial |
| `status_novo` | text | NÃO | Novo status após a mudança |
| `observacao` | text | SIM | Mensagem opcional do admin |
| `admin_id` | uuid | SIM | FK → auth.users (quem fez a mudança) |
| `criado_em` | timestamptz | NÃO | Quando a mudança ocorreu |

### Relacionamentos

```
auth.users (Supabase Auth)
    │
    ├── chamados.responsavel_id (1:N)
    └── chamado_historico.admin_id (1:N)

chamados.id
    └── chamado_historico.chamado_id (1:N)
```

### RLS (Row Level Security)

O Supabase usa RLS para controlar acesso no nível do banco. As políticas devem ser
configuradas no painel Supabase → Table Editor → Policies:

- `chamados`: permitir INSERT para anon (criação pública), SELECT para authenticated
- `chamado_historico`: permitir SELECT para anon (necessário para acompanhar), INSERT apenas para authenticated

---

## Fluxo de Autenticação

```
1. Usuário acessa /admin/qualquer-rota
        │
        ▼
2. middleware.ts intercepta o request
        │
        ├─ pathname === '/admin/login' → passa direto
        │
        └─ qualquer outra rota /admin/*
               │
               ▼
        3. createServerClient() lê cookies de sessão Supabase
               │
               ▼
        4. supabase.auth.getUser() valida JWT com servidor Supabase
               │
               ├─ user != null → NextResponse.next() (request continua)
               │
               └─ user == null → NextResponse.redirect('/admin/login?redirectTo=...')
                                          │
                                          ▼
                               5. Usuário preenche email/senha
                                          │
                                          ▼
                               6. supabase.auth.signInWithPassword()
                                          │
                               ├─ sucesso → router.push('/admin')
                               └─ erro → exibe "Email ou senha incorretos"
```

**Tokens de sessão** são armazenados em cookies HttpOnly pelo Supabase, renováveis automaticamente pelo middleware via `@supabase/ssr`.

---

## APIs Disponíveis

### `POST /api/chamados`
Cria um novo chamado de manutenção. **Público** (sem autenticação).

**Rate limit:** 5 requests/minuto por IP.

**Body (JSON):**
```json
{
  "sala": "sala-a",
  "tipo_problema": "Eletrica",
  "descricao": "Lâmpada queimada na entrada",
  "urgencia": "media"
}
```

**Valores válidos:**
- `tipo_problema`: `Eletrica`, `Hidraulica`, `Iluminacao`, `Mobiliario`, `Equipamentos`, `Infraestrutura`, `Outros`
- `urgencia`: `baixa`, `media`, `alta`, `muito_alta`
- `descricao`: máx. 500 caracteres

**Resposta de sucesso (200):**
```json
{
  "id": "uuid",
  "codigo_unico": "MAT-45231",
  "tipo_problema": "Eletrica",
  "status": "enviado",
  ...
}
```

**Erros:**
| Status | Motivo |
|---|---|
| 400 | Campos faltando, tipo ou urgência inválidos, descrição muito longa |
| 429 | Rate limit excedido |
| 500 | Erro interno |

---

### `GET /api/chamados/[codigo]`
Busca um chamado pelo código de acompanhamento. **Público**.

**Exemplo:** `GET /api/chamados/MAT-45231`

**Resposta de sucesso (200):**
```json
{
  "chamado": {
    "id": "uuid",
    "codigo_unico": "MAT-45231",
    "tipo_problema": "Eletrica",
    "urgencia": "media",
    "status": "em_andamento",
    "criado_em": "2026-01-15T10:30:00Z",
    "previsao_resolucao": null
  },
  "historico": [
    {
      "id": "uuid",
      "status_novo": "enviado",
      "observacao": "Chamado criado pelo usuario",
      "criado_em": "2026-01-15T10:30:00Z"
    },
    ...
  ]
}
```

**Erros:**
| Status | Motivo |
|---|---|
| 400 | Formato de código inválido |
| 404 | Chamado não encontrado |

---

## Variáveis de Ambiente

Criar o arquivo `sistema-chamados/.env.local`:

```env
# URL do projeto Supabase (encontrada em: Supabase → Settings → API → Project URL)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co

# Chave pública anônima (encontrada em: Supabase → Settings → API → anon/public)
# Segura para expor no frontend — segurança real é garantida pelo RLS
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **NUNCA** commitar o `.env.local` no git. O arquivo já está no `.gitignore`.
> A `SERVICE_ROLE_KEY` **não é usada** neste projeto — não adicionar.

---

## Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ (`node --version`)
- Conta no Supabase (gratuita em supabase.com)

### Passo a passo

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio>
cd sistema-chamados-main

# 2. Instalar dependências (na raiz, não dentro de sistema-chamados/)
npm install

# 3. Configurar variáveis de ambiente
cd sistema-chamados
cp .env.example .env.local   # ou criar manualmente
# Editar .env.local com suas credenciais Supabase

# 4. Criar as tabelas no Supabase
# Acesse: Supabase → SQL Editor e execute o SQL da seção "Schema SQL" abaixo

# 5. Iniciar o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

### Schema SQL para criar as tabelas

```sql
-- Tabela principal de chamados
CREATE TABLE chamados (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_unico text UNIQUE NOT NULL,
  tipo_problema text NOT NULL,
  descricao text NOT NULL,
  urgencia text NOT NULL CHECK (urgencia IN ('baixa', 'media', 'alta', 'muito_alta')),
  status text NOT NULL DEFAULT 'enviado'
    CHECK (status IN ('enviado', 'recebido', 'em_analise', 'em_andamento', 'resolvido')),
  sala_id uuid NULL,
  criado_em timestamptz DEFAULT now() NOT NULL,
  atualizado_em timestamptz NULL,
  previsao_resolucao timestamptz NULL,
  responsavel_id uuid NULL REFERENCES auth.users(id)
);

-- Histórico de mudanças de status
CREATE TABLE chamado_historico (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chamado_id uuid NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
  status_anterior text NULL,
  status_novo text NOT NULL,
  observacao text NULL,
  admin_id uuid NULL REFERENCES auth.users(id),
  criado_em timestamptz DEFAULT now() NOT NULL
);

-- Índices para queries frequentes
CREATE INDEX idx_chamados_status ON chamados(status);
CREATE INDEX idx_chamados_urgencia ON chamados(urgencia);
CREATE INDEX idx_chamados_criado_em ON chamados(criado_em DESC);
CREATE INDEX idx_historico_chamado_id ON chamado_historico(chamado_id);

-- RLS: habilitar segurança por linha
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamado_historico ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Anon pode criar chamados" ON chamados FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon pode ler por codigo" ON chamados FOR SELECT TO anon USING (true);
CREATE POLICY "Auth pode atualizar chamados" ON chamados FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth pode ler tudo" ON chamados FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon pode ler historico" ON chamado_historico FOR SELECT TO anon USING (true);
CREATE POLICY "Auth pode inserir historico" ON chamado_historico FOR INSERT TO authenticated WITH CHECK (true);
```

### Criar usuário admin

No Supabase → Authentication → Users → Add User:
- Email: seu@email.com
- Password: senha segura
- Auto Confirm User: sim

---

## Como Fazer Deploy em Servidor Próprio

### Opção A — PM2 (recomendado para VPS simples)

```bash
# 1. No servidor, instalar Node.js 18+ e PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 2. Clonar e configurar o projeto
git clone <url-do-repositorio> /var/www/sistema-chamados
cd /var/www/sistema-chamados
npm install

# 3. Criar o .env.local
cd sistema-chamados
nano .env.local
# Adicionar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Build de produção
npm run build

# 5. Iniciar com PM2
pm2 start npm --name "sistema-chamados" -- start
pm2 save          # salva para reiniciar automaticamente após reboot
pm2 startup       # configura autostart no boot

# Verificar status
pm2 status
pm2 logs sistema-chamados

# Atualizar o sistema
git pull
npm install
npm run build
pm2 restart sistema-chamados
```

**Configurar porta:** por padrão roda na porta 3000. Configure um reverse proxy (Nginx ou Caddy) para expor na porta 80/443:

```nginx
# /etc/nginx/sites-available/sistema-chamados
server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> O header `X-Forwarded-For` é necessário para o rate limiter identificar IPs reais.

---

### Opção B — Docker

```dockerfile
# Dockerfile (criar em sistema-chamados-main/)
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
WORKDIR /app/sistema-chamados
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app/sistema-chamados
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/sistema-chamados/.next ./.next
COPY --from=builder /app/sistema-chamados/public ./public
COPY --from=builder /app/sistema-chamados/package.json ./package.json
COPY --from=builder /app/sistema-chamados/next.config.ts ./next.config.ts

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build e execução
docker build -t sistema-chamados .
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  --name sistema-chamados \
  sistema-chamados
```

---

## Níveis de Usuário e Permissões

| Tipo | Autenticação | Pode fazer |
|---|---|---|
| **Usuário anônimo** | Nenhuma | Abrir chamado, acompanhar por código |
| **Admin** | Email/senha Supabase | Tudo do anônimo + ver painel, atualizar status, gerar QR Codes, ver relatórios |

Atualmente há apenas um nível de admin. Para múltiplos níveis (ex: "supervisor" vs "técnico"), adicionar uma tabela `perfis` com coluna `nivel` e ajustar as políticas RLS.

---

## Fluxo Completo de um Chamado

```
ABERTURA
1. Usuário escaneia QR Code na sala
2. Acessa /sala/[token] — vê a sala detectada
3. Clica "Novo Chamado" → /novo-chamado?sala=[token]
4. Preenche tipo, descrição e urgência
5. Clica "Enviar Chamado"
6. POST /api/chamados → banco cria registro com status "enviado"
7. Usuário é redirecionado para /confirmacao?codigo=MAT-XXXXX
8. Código exibido na tela — usuário deve anotar para acompanhar

ACOMPANHAMENTO
1. Usuário acessa /acompanhar
2. Digita o código (ex: MAT-45231)
3. GET /api/chamados/MAT-45231 retorna chamado + histórico
4. Linha do tempo exibida com todos os status e observações

GESTÃO (admin)
1. Admin acessa /admin/login e autentica
2. Painel lista todos os chamados com filtros de status/urgência
3. Admin clica em um chamado → /admin/chamado/[id]
4. Seleciona novo status, opcionalmente adiciona observação
5. Clica "Salvar" → banco atualizado + histórico registrado
6. Usuário vê a mudança em tempo real ao consultar o código
```

---

## Manutenção e Backups

### Backups do banco
O Supabase realiza backups automáticos diários no plano gratuito (últimos 7 dias). Para exportar manualmente:

```bash
# Via Supabase CLI
supabase db dump -f backup.sql

# Via psql direto (usar connection string do Supabase → Settings → Database)
pg_dump "postgresql://postgres:[senha]@db.[ref].supabase.co:5432/postgres" > backup.sql
```

### Limpeza de chamados antigos
Para evitar crescimento indefinido, considerar uma rotina de arquivamento:

```sql
-- Mover chamados resolvidos há mais de 1 ano para tabela de arquivo
INSERT INTO chamados_arquivo SELECT * FROM chamados
WHERE status = 'resolvido' AND atualizado_em < NOW() - INTERVAL '1 year';

DELETE FROM chamados
WHERE status = 'resolvido' AND atualizado_em < NOW() - INTERVAL '1 year';
```

### Monitoramento
- Verificar logs do PM2: `pm2 logs sistema-chamados`
- Verificar status do Supabase: painel em supabase.com → seu projeto
- Verificar erros do Next.js: logs do servidor (stdout/stderr)

---

## Troubleshooting

### Problema: Página /admin redireciona para login mesmo após autenticar

**Causa mais comum:** Supabase não está conseguindo ler os cookies de sessão.

**Solução:**
1. Verificar se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos no `.env.local`
2. Verificar se o domínio está na lista de URLs permitidas no Supabase → Authentication → URL Configuration → Site URL
3. Em desenvolvimento, o Site URL deve ser `http://localhost:3000`

---

### Problema: "Erro ao criar chamado" ao enviar formulário

**Verificar:**
1. Tabela `chamados` existe no Supabase? Executar o schema SQL da seção anterior.
2. Política RLS `"Anon pode criar chamados"` está ativa? Supabase → Table Editor → chamados → Policies
3. Logs do servidor: `pm2 logs` ou console do terminal em dev

---

### Problema: Rate limit bloqueando usuários legítimos

O rate limit é de **5 chamados por minuto por IP**. Se usuários legítimos estiverem sendo bloqueados:

1. Editar `lib/rate-limit.ts` e aumentar `MAX_REQUESTS` ou `WINDOW_MS`
2. Reiniciar o servidor após a mudança

---

### Problema: QR Code não funciona (redireciona para erro)

**Verificar:**
1. O token na URL corresponde exatamente ao `id` da sala no array `salas` em `/admin/qrcodes/page.tsx`
2. A URL base do QR Code foi gerada com o domínio correto. Em produção, o QR Code usa `window.location.origin` — certifique-se de gerar os QR Codes a partir do domínio de produção, não do localhost.

---

### Problema: Aplicação lenta em produção

**Otimizações possíveis:**
1. Mover filtros de chamados do cliente para queries Supabase (`.eq('status', filtro)`)
2. Adicionar paginação na listagem de chamados (`.range(0, 49)`)
3. Configurar cache do Next.js para páginas estáticas (home, sala/[token])
4. Verificar uso de memória do PM2: `pm2 monit`
