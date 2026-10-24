import { LEGAL_IDENTITY as id } from "@/lib/legal/identity";
import type { LegalSection } from "@/lib/legal/types";

// Política de Privacidade (LGPD, Lei 13.709/2018). Cada afirmação corresponde ao que o
// sistema faz hoje. Onde algo AINDA NÃO existe (prazos automáticos de exclusão, por
// exemplo) o texto diz isso com todas as letras, em vez de prometer o que não há.
export const PRIVACY_INTRO =
  "Aqui explicamos quais dados pessoais o AteliFácil trata, para quê, com quem compartilha e como você exerce os seus direitos. Em resumo: usamos os dados só para fazer a plataforma funcionar, não vendemos dados e não fazemos publicidade com eles.";

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "quem-decide",
    title: "1. Quem é responsável pelos dados",
    blocks: [
      {
        type: "p",
        text: `O responsável pelo tratamento dos dados dos assinantes é ${id.responsibleName}, ${id.legalNature}, ${id.taxIdLabel} ${id.taxId}, de ${id.city}/${id.state}. Canal para assuntos de privacidade e pedidos da LGPD: ${id.contactEmail}.`,
      },
      {
        type: "p",
        text: "Como a plataforma é operada por uma pessoa física, não há um encarregado (DPO) separado: o contato acima é o canal oficial para titulares de dados e para a ANPD.",
      },
    ],
  },
  {
    id: "dois-papeis",
    title: "2. Dois tipos de dados, duas responsabilidades",
    blocks: [
      {
        type: "p",
        text: "Dados dos assinantes (as artesãs e donas de loja): o AteliFácil decide por que e como usá-los. Somos o controlador desses dados, e esta Política trata principalmente deles.",
      },
      {
        type: "p",
        text: "Dados das compradoras e clientes de cada loja (nome, telefone, pedidos e histórico que a loja cadastra no painel): quem decide o que fazer com eles é a própria loja, que é a controladora. O AteliFácil atua apenas como operador: guarda e exibe esses dados no painel da loja, seguindo as instruções dela, e não os usa para finalidades próprias.",
      },
      {
        type: "p",
        text: "Se você é cliente de uma loja e quer saber, corrigir ou apagar dados seus, fale primeiro com a loja. Se ela não resolver, escreva para o nosso contato e ajudaremos no que estiver ao nosso alcance.",
      },
    ],
  },
  {
    id: "dados-coletados",
    title: "3. Quais dados tratamos",
    blocks: [
      { type: "p", text: "Dados do cadastro e da loja (assinantes):" },
      {
        type: "ul",
        items: [
          "e-mail e senha de acesso (a senha é gerenciada pelo serviço de autenticação e não é visível para nós);",
          "nome completo e CPF ou CNPJ do responsável pela loja;",
          "nome da loja, endereço do catálogo, WhatsApp, cidade e estado, tipo de artesanato, Instagram e descrição;",
          "informações opcionais de divulgação: se faz encomenda sob medida, se envia para todo o Brasil, há quanto tempo atua e se autoriza a divulgação no marketplace;",
          "o conteúdo da loja: logotipo, fotos, vídeos, produtos, variações e preços;",
          "chave Pix e dados de precificação (valores de custo, remuneração mensal, impostos e margem), guardados em área privada visível apenas para a própria loja e para a administração da plataforma.",
        ],
      },
      { type: "p", text: "Dados da assinatura:" },
      {
        type: "ul",
        items: [
          "identificadores do seu cadastro e da sua assinatura na Stripe, plano, situação (em teste, ativa, em atraso, cancelada) e datas de teste, renovação e cancelamento;",
          "o número completo do cartão NÃO fica conosco: ele é informado diretamente à Stripe.",
        ],
      },
      { type: "p", text: "Dados das clientes e compradoras que a loja cadastra:" },
      {
        type: "ul",
        items: ["nome, telefone e o histórico de pedidos e encomendas que a loja registra no painel."],
      },
      { type: "p", text: "Dados técnicos e de segurança:" },
      {
        type: "ul",
        items: [
          "no aceite dos Termos: data e hora, versões aceitas, endereço IP e identificação do navegador;",
          "registros de acesso (como endereço IP e horário) mantidos pelos serviços de hospedagem e de banco de dados;",
          "cookies de sessão para manter você logada e uma verificação de segurança (CAPTCHA) nas telas de login e cadastro.",
        ],
      },
      { type: "p", text: "Estatísticas do catálogo:" },
      {
        type: "ul",
        items: [
          "contamos visualizações de produtos e cliques no botão de WhatsApp sem identificar o visitante: não guardamos IP, nome, telefone ou identificador do visitante nessas estatísticas.",
        ],
      },
    ],
  },
  {
    id: "finalidades",
    title: "4. Para que usamos os dados e em que base legal",
    blocks: [
      {
        type: "ul",
        items: [
          "Criar e manter a conta, hospedar a loja e prestar o serviço: execução de contrato.",
          "Cobrar a assinatura e administrar teste, renovação, atraso e cancelamento: execução de contrato e cumprimento de obrigações legais e fiscais.",
          "Identificar o responsável pela loja (nome e CPF ou CNPJ), emitir documentos fiscais quando exigido e prevenir fraudes: execução de contrato, obrigação legal e legítimo interesse.",
          "Enviar mensagens do serviço (confirmação de e-mail, redefinição de senha, avisos de cobrança): execução de contrato.",
          "Proteger a plataforma (CAPTCHA, limite de tentativas, registros de segurança): legítimo interesse.",
          "Registrar o aceite dos Termos e da Política (data, versões, IP e navegador), para provar que o aceite ocorreu: exercício regular de direitos.",
          "Exibir a sua loja no marketplace de divulgação, quando ele existir: consentimento, que você pode retirar a qualquer momento nas Configurações.",
        ],
      },
      {
        type: "p",
        text: "Não vendemos dados pessoais, não os cedemos para publicidade de terceiros e não montamos perfis de comportamento.",
      },
    ],
  },
  {
    id: "compartilhamento",
    title: "5. Com quem os dados são compartilhados",
    blocks: [
      {
        type: "p",
        text: "Usamos serviços de empresas especializadas (operadores) para fazer a plataforma funcionar. Elas só recebem os dados de que precisam para a sua função:",
      },
      {
        type: "ul",
        items: [
          "Supabase: banco de dados, autenticação e armazenamento de arquivos (o projeto fica na região de São Paulo);",
          "Vercel: hospedagem e entrega do site, com registros de acesso;",
          "Stripe: pagamentos e assinaturas;",
          "Resend: envio dos e-mails de confirmação de conta e redefinição de senha;",
          "Cloudflare: verificação de segurança (CAPTCHA Turnstile) nas telas de login e cadastro.",
        ],
      },
      {
        type: "p",
        text: "Também podemos compartilhar dados com autoridades quando houver obrigação legal ou ordem judicial.",
      },
      {
        type: "p",
        text: "O catálogo da loja é público por natureza: o nome da loja, os produtos, os preços, a cidade e o WhatsApp que a loja cadastra podem ser vistos por qualquer pessoa com o link. Se você autorizar a divulgação no marketplace, nome da loja, cidade e estado, tipo de artesanato e link do catálogo também poderão ser exibidos lá.",
      },
      {
        type: "p",
        text: "Alguns desses serviços podem processar dados fora do Brasil (por exemplo, nos Estados Unidos). Eles seguem as próprias políticas e salvaguardas de proteção de dados.",
      },
    ],
  },
  {
    id: "cookies",
    title: "6. Cookies e armazenamento no navegador",
    blocks: [
      {
        type: "ul",
        items: [
          "Cookies essenciais de sessão, necessários para você entrar no painel e permanecer logada.",
          "Verificação de segurança (Cloudflare Turnstile) nas telas de login, cadastro e recuperação de senha.",
          "No catálogo, a lista de peças que a visitante escolhe em 'Minha sacola' fica guardada no próprio navegador dela (armazenamento local) e não é enviada para nós.",
        ],
      },
      { type: "p", text: "Não usamos cookies de publicidade nem ferramentas de rastreamento de terceiros." },
    ],
  },
  {
    id: "seguranca",
    title: "7. Como protegemos os dados",
    blocks: [
      { type: "p", text: "Medidas que existem hoje:" },
      {
        type: "ul",
        items: [
          "conexão protegida (HTTPS) em todo o site;",
          "no banco de dados, cada loja só acessa os próprios dados, por regras de acesso por linha (RLS);",
          "dados de cartão tratados apenas pela Stripe;",
          "senhas gerenciadas pelo serviço de autenticação, com confirmação de e-mail e recuperação de senha por link de uso limitado;",
          "CAPTCHA e limite de tentativas nas telas de login e cadastro, para dificultar robôs;",
          "acesso administrativo restrito, e registros de aceite que usuários comuns não conseguem alterar.",
        ],
      },
      {
        type: "p",
        text: "Nenhum sistema é totalmente imune a falhas. Se ocorrer um incidente que possa gerar risco relevante aos titulares, comunicaremos os afetados e a ANPD, conforme a LGPD.",
      },
    ],
  },
  {
    id: "retencao",
    title: "8. Por quanto tempo guardamos e como excluir",
    blocks: [
      {
        type: "p",
        text: "Guardamos os dados enquanto a sua conta existir. Hoje não existe exclusão automática: ao cancelar a assinatura ou ao fim do teste, a loja e os seus dados continuam guardados (apenas o catálogo público fica indisponível) até que você peça a exclusão. Ainda não definimos um prazo automático de eliminação para contas inativas; se definirmos, avisaremos antes.",
      },
      {
        type: "p",
        text: `Para excluir a conta e os dados definitivamente (loja, produtos, pedidos, clientes cadastrados, imagens, vídeos e o login), escreva para ${id.contactEmail}. A exclusão é feita por nós, a partir do seu pedido, e não pode ser desfeita.`,
      },
      {
        type: "p",
        text: "Dados de pagamento mantidos pela Stripe ficam sujeitos às regras e aos prazos da própria Stripe e da legislação. Registros mantidos pelos serviços de hospedagem e de banco de dados (como logs) podem permanecer por prazo limitado segundo as políticas deles.",
      },
    ],
  },
  {
    id: "direitos",
    title: "9. Seus direitos",
    blocks: [
      { type: "p", text: "A LGPD garante a você, a qualquer momento:" },
      {
        type: "ul",
        items: [
          "confirmar se tratamos dados seus e ter acesso a eles;",
          "corrigir dados incompletos, inexatos ou desatualizados;",
          "pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados fora da lei;",
          "pedir a portabilidade dos seus dados;",
          "pedir a eliminação dos dados tratados com o seu consentimento;",
          "saber com quais entidades compartilhamos os dados;",
          "ser informada sobre a possibilidade de não consentir e sobre as consequências disso;",
          "retirar o consentimento (a divulgação no marketplace pode ser desligada nas Configurações da loja).",
        ],
      },
      {
        type: "p",
        text: `Para exercer qualquer um desses direitos, escreva para ${id.contactEmail}. Podemos pedir informações para confirmar a sua identidade. Responderemos dentro dos prazos legais.`,
      },
      {
        type: "p",
        text: "Você também pode registrar reclamação na Autoridade Nacional de Proteção de Dados (ANPD), em gov.br/anpd.",
      },
    ],
  },
  {
    id: "criancas",
    title: "10. Crianças e adolescentes",
    blocks: [
      {
        type: "p",
        text: "O AteliFácil é destinado a maiores de 18 anos. Não coletamos intencionalmente dados de crianças e adolescentes.",
      },
    ],
  },
  {
    id: "alteracoes",
    title: "11. Mudanças nesta Política",
    blocks: [
      {
        type: "p",
        text: "Podemos atualizar esta Política. A versão e a data de vigência aparecem no topo da página, e o aceite de cada cadastro registra a versão que você viu. Quando a mudança for relevante, avisaremos pelos contatos cadastrados.",
      },
    ],
  },
  {
    id: "contato",
    title: "12. Contato",
    blocks: [
      {
        type: "p",
        text: `Dúvidas sobre privacidade ou pedidos de titulares: ${id.contactEmail}.`,
      },
    ],
  },
];
