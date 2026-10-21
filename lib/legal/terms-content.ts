import { LEGAL_IDENTITY as id } from "@/lib/legal/identity";
import type { LegalSection } from "@/lib/legal/types";

// Termos de Uso do AteliFácil. Escritos em linguagem direta e SÓ descrevem o que o
// sistema faz de fato hoje. Pontos que dependem de decisão ou validação humana
// (advogado/contador) estão listados no relatório de entrega, não escondidos aqui.
export const TERMS_INTRO =
  "Estes Termos explicam, em linguagem simples, como o AteliFácil funciona, o que você pode esperar de nós e o que esperamos de você. Leia com calma antes de criar a sua conta.";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "quem-somos",
    title: "1. Quem somos",
    blocks: [
      {
        type: "p",
        text: `O ${id.productName} (${id.site}) é uma plataforma online que ajuda artesãs e pequenos ateliês a criarem um catálogo digital, receberem pedidos pelo WhatsApp e organizarem suas encomendas.`,
      },
      {
        type: "p",
        text: `A plataforma é oferecida por ${id.responsibleName}, ${id.legalNature}, inscrito no ${id.taxIdLabel} ${id.taxId}, com sede em ${id.city}/${id.state} (aqui chamado de "${id.productName}" ou "nós"). Contato oficial: ${id.contactEmail}.`,
      },
      {
        type: "p",
        text: "O AteliFácil está em fase de implantação comercial e ainda não possui CNPJ. Quando isso mudar, estes Termos serão atualizados com os novos dados do responsável.",
      },
    ],
  },
  {
    id: "cadastro",
    title: "2. Sua conta",
    blocks: [
      {
        type: "p",
        text: "Para usar o AteliFácil você precisa criar uma conta, ser maior de 18 anos (ou legalmente capaz) e marcar que leu e concorda com estes Termos e com a Política de Privacidade.",
      },
      {
        type: "ul",
        items: [
          "Informe dados verdadeiros e mantenha-os atualizados (nome, CPF ou CNPJ, WhatsApp, e-mail).",
          "Cada conta corresponde a uma loja.",
          "A senha é pessoal. Você é responsável por tudo que for feito com a sua conta, então não a compartilhe.",
          "Se suspeitar de uso indevido da sua conta, avise-nos pelo e-mail de contato.",
        ],
      },
    ],
  },
  {
    id: "como-funciona",
    title: "3. Como o AteliFácil funciona",
    blocks: [
      {
        type: "p",
        text: "Ao criar a sua loja, você ganha um endereço próprio (nomedaloja.atelifacil.com.br) e um painel para cadastrar produtos, variações, fotos e vídeos, organizar clientes e encomendas, calcular preços e acompanhar visualizações do catálogo.",
      },
      {
        type: "p",
        text: "O catálogo é público: qualquer pessoa com o link pode vê-lo, inclusive o nome da loja, os produtos, os preços e o seu WhatsApp. O botão de contato apenas abre uma conversa no WhatsApp do visitante, usando um link com mensagem pronta; o AteliFácil não usa a API oficial do WhatsApp e não participa da conversa.",
      },
      {
        type: "p",
        text: "As funcionalidades podem evoluir, mudar de lugar ou ser descontinuadas. Quando uma mudança afetar de forma relevante o que você contratou, avisaremos pelos contatos cadastrados.",
      },
    ],
  },
  {
    id: "teste-gratuito",
    title: "4. Teste gratuito de 30 dias",
    blocks: [
      {
        type: "p",
        text: "Toda loja nova tem 30 dias de teste gratuito, sem cobrança e sem precisar informar cartão de crédito. O teste é concedido uma vez por loja e não pode ser renovado.",
      },
      {
        type: "ul",
        items: [
          "Durante o teste, o catálogo fica no ar normalmente.",
          "Se o teste terminar sem que você tenha contratado a assinatura, o catálogo público fica indisponível (quem acessar vê um aviso), mas você continua conseguindo entrar no painel para assinar e reativá-lo.",
          "Nenhuma cobrança é feita ao fim do teste se você não tiver contratado a assinatura.",
          "Se você assinar durante o teste, os dias que sobraram são mantidos: a primeira cobrança só acontece quando o teste terminar.",
        ],
      },
    ],
  },
  {
    id: "assinatura",
    title: "5. Assinatura, pagamento e renovação",
    blocks: [
      {
        type: "p",
        text: "Depois do teste, o uso continuado exige uma assinatura mensal. O valor vigente e as condições são mostrados na tela de contratação, antes da confirmação do pagamento.",
      },
      {
        type: "ul",
        items: [
          "Os pagamentos são processados pela Stripe, em ambiente seguro da própria Stripe. O AteliFácil não tem acesso ao número completo do seu cartão.",
          "A assinatura renova automaticamente todo mês, no cartão informado, até que você cancele.",
          "Podemos alterar o valor da assinatura. Avisaremos com pelo menos 30 dias de antecedência, o novo valor só vale a partir da renovação seguinte ao aviso e você pode cancelar antes dela.",
          `Se uma cobrança falhar (cartão recusado, por exemplo), o catálogo continua no ar por 7 dias depois do fim do período já pago, enquanto a Stripe tenta cobrar de novo. Se o pagamento não for regularizado nesse prazo, o catálogo público fica indisponível até a regularização. O painel continua acessível para você atualizar a forma de pagamento.`,
          "Comprovantes de pagamento e documentos fiscais serão fornecidos conforme as obrigações legais aplicáveis.",
        ],
      },
    ],
  },
  {
    id: "cancelamento",
    title: "6. Cancelamento",
    blocks: [
      {
        type: "p",
        text: "Você pode cancelar a assinatura quando quiser, sem multa, em Configurações > Gerenciar assinatura, ou pedindo por e-mail.",
      },
      {
        type: "ul",
        items: [
          "O cancelamento vale ao fim do período já pago: você continua usando até essa data e não há novas cobranças.",
          "Cancelar durante o teste gratuito não gera nenhuma cobrança.",
          "Cancelar não apaga os seus dados automaticamente. Para excluir a conta e os dados definitivamente, peça pelo e-mail de contato (veja a Política de Privacidade).",
          "Você pode assinar de novo quando quiser.",
        ],
      },
    ],
  },
  {
    id: "arrependimento",
    title: "7. Direito de arrependimento",
    blocks: [
      {
        type: "p",
        text: "Quando a contratação se enquadrar como relação de consumo, você pode desistir da assinatura em até 7 (sete) dias corridos, contados da contratação paga (a primeira cobrança), conforme o art. 49 do Código de Defesa do Consumidor, e receber de volta todos os valores pagos.",
      },
      {
        type: "p",
        text: `Para exercer esse direito, escreva para ${id.contactEmail} informando o e-mail da conta. O reembolso é feito pelo mesmo meio de pagamento utilizado.`,
      },
    ],
  },
  {
    id: "responsabilidade-das-lojas",
    title: "8. Responsabilidade das lojas",
    blocks: [
      {
        type: "p",
        text: "O AteliFácil fornece a ferramenta. Cada loja é a única responsável pelo que anuncia e vende. A venda é uma relação direta entre a loja e quem compra: o AteliFácil não é parte dela e não recebe nem repassa os pagamentos das compras.",
      },
      {
        type: "p",
        text: "Cabe à loja, entre outras obrigações:",
      },
      {
        type: "ul",
        items: [
          "descrever os produtos com veracidade (materiais, medidas, prazos de produção, preços e disponibilidade);",
          "cumprir prazos, combinados de entrega, trocas, garantias e demais deveres perante quem comprou, inclusive os do Código de Defesa do Consumidor;",
          "cumprir as obrigações tributárias e fiscais da sua atividade, inclusive emitir nota fiscal quando a lei exigir;",
          "tratar com cuidado os dados das suas clientes (veja a Política de Privacidade).",
        ],
      },
      {
        type: "p",
        text: "Não é permitido usar a plataforma para anunciar produtos ilegais ou falsificados, violar direitos de terceiros, enganar compradores, discriminar pessoas ou praticar fraudes.",
      },
    ],
  },
  {
    id: "propriedade-intelectual",
    title: "9. Conteúdo e propriedade intelectual",
    blocks: [
      {
        type: "p",
        text: `O software, a marca ${id.productName}, o layout e os textos da plataforma pertencem ao responsável pelo AteliFácil. Você recebe apenas uma licença limitada e não exclusiva para usá-los enquanto a conta estiver ativa.`,
      },
      {
        type: "p",
        text: "O conteúdo da sua loja (fotos, vídeos, textos, logotipo e marca) continua sendo seu. Você nos autoriza a hospedar, exibir e processar esse conteúdo apenas para operar o serviço: manter o catálogo no ar, o painel e, se você optar por isso, a divulgação no marketplace. Você declara ter os direitos necessários sobre tudo que enviar.",
      },
    ],
  },
  {
    id: "marketplace",
    title: "10. Divulgação no marketplace (opcional)",
    blocks: [
      {
        type: "p",
        text: "Estamos desenvolvendo uma vitrine para divulgar ateliês. Participar é opcional e depende de um consentimento separado, dado no cadastro ou nas Configurações. Ao autorizar, você permite que o AteliFácil exiba o nome da loja, a cidade e o estado, o tipo de artesanato e o link do catálogo nessa vitrine.",
      },
      {
        type: "p",
        text: "Você pode retirar o consentimento a qualquer momento em Configurações. A vitrine ainda não está disponível publicamente.",
      },
    ],
  },
  {
    id: "suspensao",
    title: "11. Suspensão e encerramento de contas",
    blocks: [
      {
        type: "p",
        text: "Podemos suspender ou encerrar uma conta em caso de violação destes Termos, uso ilegal ou fraudulento, ordem de autoridade ou pagamento não regularizado após o prazo de carência. Sempre que possível, avisaremos antes e daremos a chance de você regularizar a situação ou apresentar explicações, exceto quando houver risco ou urgência.",
      },
      {
        type: "p",
        text: "Você também pode encerrar a sua conta quando quiser (veja os itens 6 e 12).",
      },
    ],
  },
  {
    id: "disponibilidade",
    title: "12. Falhas, disponibilidade e responsabilidade",
    blocks: [
      {
        type: "p",
        text: "Nos empenhamos para manter a plataforma no ar e funcionando bem, mas não garantimos funcionamento ininterrupto. Pode haver manutenção, instabilidade e falhas, inclusive de serviços de terceiros dos quais dependemos (hospedagem, banco de dados, pagamentos, envio de e-mail e WhatsApp).",
      },
      {
        type: "p",
        text: "Respondemos pelos danos que causarmos por falha nossa, na forma da lei. Nada nestes Termos limita ou exclui direitos que a legislação (inclusive o Código de Defesa do Consumidor) não permite limitar ou excluir.",
      },
      {
        type: "p",
        text: "Recomendamos que você mantenha cópia das informações importantes do seu negócio (fotos originais, lista de clientes e pedidos).",
      },
    ],
  },
  {
    id: "privacidade",
    title: "13. Privacidade e proteção de dados",
    blocks: [
      {
        type: "p",
        text: "O tratamento de dados pessoais é explicado na Política de Privacidade, que faz parte destes Termos. Ela distingue os dados dos assinantes (de responsabilidade do AteliFácil) dos dados das compradoras de cada loja (de responsabilidade da própria loja).",
      },
    ],
  },
  {
    id: "alteracoes",
    title: "14. Mudanças nestes Termos",
    blocks: [
      {
        type: "p",
        text: "Podemos atualizar estes Termos. A versão e a data de vigência aparecem no topo desta página, e o aceite de cada cadastro registra a versão que você viu. Quando a mudança for relevante, avisaremos pelos contatos cadastrados e, se você não concordar, poderá cancelar a assinatura.",
      },
    ],
  },
  {
    id: "lei-e-foro",
    title: "15. Lei aplicável e foro",
    blocks: [
      {
        type: "p",
        text: "Estes Termos seguem as leis brasileiras. Antes de qualquer medida judicial, tentaremos resolver a questão de forma amigável pelo e-mail de contato.",
      },
      {
        type: "p",
        text: `Quando a relação for de consumo, o foro é o do domicílio do consumidor. Nos demais casos, fica eleito o foro da comarca de ${id.city}/${id.state}.`,
      },
    ],
  },
  {
    id: "contato",
    title: "16. Contato",
    blocks: [
      {
        type: "p",
        text: `Dúvidas, reclamações, pedidos de cancelamento ou de reembolso: ${id.contactEmail}.`,
      },
    ],
  },
];
