# RecebeAqui: encomendas da associação de moradores

Sistema web (feito para celular) que substitui o aviso de encomendas no grupo do WhatsApp:

- a associação registra a encomenda em poucos toques;
- o morador recebe o aviso no **WhatsApp** (ou por **email** se o WhatsApp falhar), com um **código de retirada**;
- o morador acompanha o que está esperando por ele e o histórico;
- a associação confirma a entrega, vê quem está esperando há muito tempo e cuida do cadastro dos moradores.

| Pasta | O que é |
|---|---|
| `backend-laravel/` | API em Laravel 12 (PHP 8.3) + MySQL |
| `frontend/` | Site em React + Tailwind |
| `docker-compose.yml` | Sobe tudo junto (banco, API e site) |

---

## Rodar com Docker (recomendado)

Só precisa do [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) ou Docker + Compose (Linux).

```bash
git clone <url-do-repositorio>
cd Projeto-Santo-Amaro
docker compose up -d --build
```

Espere 1 ou 2 minutos na primeira vez e abra **http://localhost:8080**.

Na primeira subida o sistema cria as tabelas sozinho e uma associação de exemplo:

| Quem | WhatsApp para entrar | Senha |
|---|---|---|
| Administração | (11) 90000-0001 | senha123 |
| Morador | (11) 90000-0002 | senha123 |

Código da associação de exemplo (para testar o cadastro de morador): **SANTO1**

### Comandos úteis

```bash
docker compose ps                  # ver se está tudo rodando
docker compose logs -f backend     # ver o que a API está fazendo (avisos aparecem aqui)
docker compose down                # desligar (os dados continuam salvos)
docker compose up -d --build       # ligar de novo / aplicar atualizações do código
docker compose down -v             # desligar e APAGAR o banco (começa do zero)
```

Ver as mensagens de WhatsApp e email simuladas (modo `log`):

```bash
docker compose exec backend tail -n 50 storage/logs/laravel.log
```

### Configurar (opcional)

Sem configuração nenhuma, o sistema roda na **versão gratuita** em modo de teste: os emails são **gravados no log**, e o WhatsApp é enviado pela administração com o botão **“Avisar pelo meu WhatsApp”**.
Para personalizar, crie um `.env` na raiz a partir do exemplo e suba de novo:

```bash
cp .env.docker.example .env        # no Windows: copy .env.docker.example .env
docker compose up -d --build
```

Principais opções do `.env`:

| Variável | Para que serve |
|---|---|
| `APP_PORT` | Porta do site (padrão `8080`) |
| `APP_URL` | Endereço público do site, ex.: `https://encomendas.minhaassociacao.org` |
| `SEED_DEMO` | `true` cria os dados de exemplo no primeiro start. Use `false` em produção |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD` | Senhas do MySQL. **Troque antes da primeira subida** em produção |
| `MAIL_*` | Envio de email de verdade (SMTP grátis: Gmail com senha de app, Brevo) |
| `WHATSAPP_DRIVER` | `none` (padrão, gratuito), `log` (teste), `zapi` ou `ultramsg` (pagos) |
| `CLOUDFLARE_TUNNEL_TOKEN` | Endereço fixo na internet pelo Cloudflare Tunnel (grátis) |

### Versão gratuita (sem custo mensal)

| Parte | Como funciona |
|---|---|
| Email | Automático, por SMTP grátis (Gmail ~500/dia ou Brevo 300/dia) |
| WhatsApp | Na tela “Registrada!” e na encomenda, o botão **Avisar pelo meu WhatsApp** abre o WhatsApp de quem está no painel com a mensagem pronta. O sistema registra o aviso |
| Pendências | O painel mostra quantas encomendas **faltam avisar**, e a lista tem o filtro “Só as que faltam avisar” |
| Internet | Cloudflare Tunnel (grátis, HTTPS, sem abrir porta no roteador) |

#### Ativar email de verdade (Gmail, grátis)

1. Ative a verificação em duas etapas da conta Google.
2. Crie uma senha de app em https://myaccount.google.com/apppasswords.
3. No `.env`:
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=seuemail@gmail.com
   MAIL_PASSWORD=senha-de-app-de-16-letras
   MAIL_FROM_ADDRESS=seuemail@gmail.com
   ```
4. `docker compose up -d`

#### Colocar na internet de graça (Cloudflare Tunnel)

Teste rápido, sem conta (o endereço muda toda vez que o túnel reinicia):

```bash
docker compose --profile tunel-teste up -d
docker compose logs tunnel-teste     # procure o endereço https://...trycloudflare.com
```

Endereço fixo (conta grátis na Cloudflare, precisa de um domínio apontado para ela):

1. Em https://one.dash.cloudflare.com → *Networks* → *Tunnels*, crie um túnel (tipo *Cloudflared*) e copie o token.
2. Em *Public hostname*, aponte o seu domínio (ex.: `encomendas.suaassociacao.org`) para `http://frontend:80`.
3. No `.env`: `CLOUDFLARE_TUNNEL_TOKEN=...` e `APP_URL=https://encomendas.suaassociacao.org`.
4. `docker compose --profile tunel up -d`

O computador (ou VPS gratuita) precisa ficar ligado.

#### WhatsApp automático (opcional, pago)

Se a associação quiser que o aviso saia sozinho, contrate [Z-API](https://z-api.io) ou [UltraMsg](https://ultramsg.com) e use **um chip só para isso** (não são APIs oficiais e o número pode ser bloqueado). No `.env`:

```env
WHATSAPP_DRIVER=zapi
ZAPI_INSTANCE=sua-instancia
ZAPI_TOKEN=seu-token
ZAPI_CLIENT_TOKEN=seu-client-token
```

O driver `twilio` existe, mas a API oficial exige templates aprovados pela Meta para iniciar conversa, o que ainda não é suportado.

### Colocar na internet (outras opções)

- Rode numa VPS com Docker, aponte o domínio e coloque HTTPS na frente (Caddy, Nginx Proxy Manager ou o Cloudflare Tunnel acima).
- Ajuste `APP_URL`, `SEED_DEMO=false` e as senhas do banco **antes** da primeira subida.
- O MySQL não é exposto para fora: só os containers falam com ele.
- Backup do banco:
  ```bash
  docker compose exec db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" encomendas' > backup.sql
  ```

---

## Rodar sem Docker (desenvolvimento)

Precisa de PHP 8.2+, Composer, Node 20+ e MySQL.

```bash
# API
cd backend-laravel
composer install
cp .env.example .env          # ajuste DB_* para o seu MySQL
php artisan key:generate
php artisan migrate --seed
php artisan serve             # http://127.0.0.1:8000

# Site (outro terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173 (repassa /api para a porta 8000)
```

Testes da API: `cd backend-laravel && php artisan test`

---

## Como funciona

**Fluxo da associação**
1. Cria a associação em “Cadastre a associação” e recebe um **código** (ex.: `SANTO1`).
2. Manda o código no grupo (botão em *Ajustes*) **ou** cadastra moradores direto em *Moradores*.
3. Chegou encomenda: **Registrar**, escolhe o morador, toca no tipo, pronto. O aviso sai na hora.
4. Na retirada: abre a encomenda, **Entregar ao morador** (pode conferir o código de 4 dígitos).

**Fluxo do morador**
1. Faz o cadastro com o código da associação (nome, WhatsApp, senha; email opcional).
2. A associação confirma.
3. Recebe a mensagem: *“Olá, Artur! Seu pacote chegou na Associação… Pode retirar quando quiser 😊 Código de retirada: 4821”*.
4. Em “Minhas encomendas” vê o que está esperando e o histórico.

**Regras de aviso**
- WhatsApp automático quando o morador permite e há provedor configurado.
- Sem provedor (versão gratuita), a administração avisa pelo botão **Avisar pelo meu WhatsApp** e o aviso fica registrado.
- Email quando o morador tem email e permite, **ou sempre que o WhatsApp automático falhar ou estiver desligado** (fallback).
- Toda tentativa fica registrada; o painel avisa quando algo não foi entregue ou quando falta avisar.

### Banco de dados

| Tabela | Conteúdo |
|---|---|
| `users` | Pessoas: nome, telefone (único, identificador principal), email opcional, senha, preferências de aviso |
| `associations` | Associação: nome, código de convite, horário de retirada, endereço |
| `memberships` | Vínculo pessoa ↔ associação: papel (`admin`/`resident`), situação (`pending`/`approved`/`rejected`), casa/apto |
| `packages` | Encomenda: morador, tipo (pacote/carta/documento/outro), descrição, transportadora, rastreio, situação (`received`/`picked_up`), código de retirada, datas |
| `package_notifications` | Histórico de cada aviso: canal, sucesso/falha, erro |

Uma mesma pessoa pode participar de mais de uma associação. Cada associação só enxerga os próprios dados.

### API (resumo)

Autenticação por token (`Authorization: Bearer …`, Laravel Sanctum).

| Método | Rota | Quem |
|---|---|---|
| POST | `/api/auth/login` (`login` = telefone ou email, `password`) | público |
| POST | `/api/auth/register-association` | público |
| POST | `/api/auth/register` (com `invite_code`) | público |
| GET | `/api/invites/{codigo}` | público |
| GET / PATCH | `/api/auth/me`, `/api/auth/profile` | logado |
| GET | `/api/my/packages` | morador aprovado |
| GET | `/api/admin/dashboard` | administração |
| GET / POST / PATCH / DELETE | `/api/admin/residents[/{id}]`, `…/approve`, `…/reject` | administração |
| GET / POST / PATCH / DELETE | `/api/admin/packages[/{id}]`, `…/pickup`, `…/undo-pickup`, `…/notify`, `…/notified-manually` | administração |
| PATCH / POST | `/api/admin/association`, `/api/admin/association/invite-code` | administração |
