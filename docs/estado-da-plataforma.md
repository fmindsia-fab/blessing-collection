# AteliFácil: estado da plataforma em produção

Resumo único do que está no ar em **22/10/2026**. Não contém chaves nem segredos (só nomes de variáveis). Detalhes técnicos e histórico: `PLAN.md` (seção 11) e `CLAUDE.md`.

## 1. O que é
Plataforma de catálogo digital para artesãs e pequenos ateliês: cada loja ganha um catálogo público próprio, recebe pedidos pelo WhatsApp (link `wa.me`) e gerencia produtos, clientes, encomendas e precificação num painel. Operada por pessoa física (sem CNPJ ainda), em fase de implantação comercial.

## 2. Endereços
| O quê | Onde |
|---|---|
| Site institucional, cadastro e painel da plataforma | `atelifacil.com.br` |
| Catálogo e painel de cada loja | `nomedaloja.atelifacil.com.br` |
| Loja com domínio próprio (hoje só a Blessing) | `blessingcollection.com.br` |
| Documentos legais | `/termos` e `/privacidade` |

## 3. O que cada pessoa consegue fazer
**Visitante do catálogo:** ver produtos, variações, preços e fotos/vídeos; filtrar; montar "Minha seleção"; chamar a loja no WhatsApp com mensagem pronta.

**Dona da loja (painel):** produtos com variações, categorias, coleções e modelos (com criação rápida pelo "+"); clientes e encomendas (cancelar e reabrir, sem apagar); precificação; identidade visual (cores, fonte, logo); perfil de divulgação (cidade/UF, tipo de artesanato, consentimento de marketplace); estatísticas simples; assinatura e portal de cobrança.

**Administrador da plataforma:** painel com métricas (lojas, testes, assinantes); detalhe de cada loja; suspender/reativar; excluir loja e conta de forma definitiva (com travas); listar e excluir logins sem loja.

## 4. Cobrança
- **Teste gratuito de 30 dias**, sem cartão, concedido uma vez por loja.
- **Assinatura mensal** no Stripe (valor lido do preço configurado no Stripe; o valor vigente aparece no Checkout).
- Assinar durante o teste **preserva os dias restantes** (a primeira cobrança só ocorre no fim do teste).
- **Falha de pagamento:** catálogo continua no ar por **7 dias** após o fim do período pago; depois fica indisponível. O painel nunca sai do ar.
- **Cancelamento** pelo portal do Stripe, valendo ao fim do período pago.
- A loja **Blessing** é cortesia permanente (nunca é afetada por eventos do Stripe).
- Validado em produção com cartão real: assinar, preservar teste, webhook, portal, cancelar e excluir.

## 5. Segurança
- Dados isolados por loja (RLS em todas as tabelas) e checagens no servidor.
- Dados financeiros (Pix, precificação) numa tabela privada, só da própria loja.
- Proteções de privilégio no banco: ninguém se promove a administrador nem reativa loja suspensa pela API; limites de tamanho e tipo nos arquivos enviados; aceite de termos imutável.
- Login/cadastro: confirmação de e-mail, recuperação de senha, CAPTCHA (Cloudflare Turnstile) e limite de tentativas (Firewall do Vercel).
- Chave de API do Stripe **restrita**, só com as permissões necessárias.
- Next.js atualizado e dependências de produção sem vulnerabilidades conhecidas.
- Auditoria completa feita em 17/10/2026; riscos aceitos registrados no `PLAN.md`.

## 6. Jurídico
- Termos de Uso e Política de Privacidade publicados, com identificação do responsável.
- **Aceite eletrônico** obrigatório no cadastro, gravado no servidor com versões, data, IP e navegador. Contas anteriores não são forçadas a aceitar.

## 7. Serviços usados (e para quê)
Supabase (banco, login e arquivos, região de São Paulo) · Vercel (hospedagem e firewall) · Stripe (assinaturas) · Resend (e-mails de confirmação e recuperação) · Cloudflare Turnstile (CAPTCHA) · IBGE (lista de cidades por UF).

## 8. Variáveis de ambiente (nomes)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (só servidor), `TENANT_RESOLUTION_MODE`, `PLATFORM_DOMAIN`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `STRIPE_SECRET_KEY` (chave restrita), `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`. Ao colar valores no Vercel, **sem espaço ou Enter no fim** (o código se protege, mas o ideal é gravar limpo).

## 9. Banco de dados
Migrations versionadas em `supabase/migrations/` (0001 a 0042), todas aplicadas. Mudanças de schema sempre por migration nova e segura.

## 10. Operação do dia a dia
- **Novo domínio próprio de uma loja:** adicionar o domínio ao widget do Turnstile (senão o login desse domínio trava) e cadastrá-lo em `store_domains`.
- **Mudar o preço da assinatura:** criar um novo Preço no Stripe (preços são imutáveis), trocar `STRIPE_PRICE_ID` no Vercel e fazer redeploy.
- **Excluir uma conta:** painel da plataforma, Zona de perigo (cancelar antes qualquer assinatura viva **na hora** no Stripe).
- **Mudou um texto legal de forma relevante:** atualizar `lib/legal/versions.ts`.
- **Erro em produção:** os logs do Vercel trazem o motivo (o Checkout, o portal e o webhook registram o erro real do Stripe).

## 11. Decisões conscientes
- Sessão **por endereço** (sem cookie compartilhado entre subdomínios), com repasse seguro de login do domínio principal para a loja.
- `owner_user_id` legível publicamente (identificador interno sem poder de acesso).
- Revisão por advogado, nota fiscal e regra de retenção de contas inativas: **fora do escopo por decisão do dono**.

## 12. Próximos passos possíveis
- Marketplace de divulgação (os dados e o consentimento já são coletados).
- Melhorias visuais e de experiência de uso.
