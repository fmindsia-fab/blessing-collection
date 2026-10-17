// Tipos gerados manualmente a partir das migrations em supabase/migrations/.
// Para regenerar via CLI: `npx supabase login` e depois
// `npx supabase gen types typescript --project-id bipadxpcbmgoatlnnyfw > types/database.types.ts`

export type ProductStatus = "available" | "made_to_order" | "sold_out" | "inactive";
export type VariantStatus = "available" | "sold_out" | "archived";
export type ArchivableStatus = "active" | "archived";
/** active | suspended (bloqueio manual da plataforma) | archived (migration 0032). */
export type StoreStatus = "active" | "suspended" | "archived";
/** MEI não entra como percentual: o DAS é custo fixo mensal (migration 0014). */
export type TaxRegime = "none" | "mei" | "simples" | "other";
export type PricingMethodValue = "margin" | "markup";
/**
 * Valor da lista curada em `lib/store/fonts.ts`. Deixou de ser union fechada
 * na migration 0010: a lista cresce sem migration, e o check do banco saiu.
 * Valor desconhecido cai no padrão em `getBrandFontVariable`.
 */
export type FontFamily = string;
export type AnalyticsEventType =
  | "product_view"
  | "whatsapp_click"
  | "category_view"
  | "collection_view";
/** Fluxo completo de encomenda (migration 0025), do orçamento à entrega. */
export type OrderStatus = "quote" | "confirmed" | "in_production" | "ready" | "delivered" | "cancelled";
/** Espelha os status nativos do Stripe (migration 0029) — não reinventar vocabulário. */
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
/** Origem da cobrança (migration 0032). */
export type BillingType = "stripe" | "complimentary" | "manual";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          /** CPF (11) ou CNPJ (14), só dígitos (migrations 0031/0033) — visível só ao dono e ao platform admin. */
          document: string | null;
          /** Admin da plataforma (migration 0030) — flag manual, não self-service. */
          is_platform_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          document?: string | null;
          is_platform_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          document?: string | null;
          is_platform_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          owner_user_id: string;
          slug: string;
          name: string;
          description: string | null;
          whatsapp_number: string;
          logo_url: string | null;
          instagram_url: string | null;
          color_primary: string;
          color_secondary: string;
          color_accent: string;
          /** Paleta da marca (migration 0009): 1 a 5 cores hex. */
          brand_colors: string[];
          font_family: FontFamily;
          /** Fonte própria (.woff2 no Storage). Precede font_family quando presente. */
          custom_font_url: string | null;
          custom_font_name: string | null;
          /** Perfil do ateliê para o marketplace (migration 0034). */
          city: string | null;
          state: string | null;
          craft_types: string[];
          craft_other: string | null;
          /** Divulgação (migration 0035): opt_in explícito, LGPD. */
          marketplace_opt_in: boolean;
          marketplace_opt_in_at: string | null;
          accepts_custom_orders: boolean | null;
          ships_nationwide: boolean | null;
          years_active: string | null;
          status: StoreStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          slug: string;
          name: string;
          description?: string | null;
          whatsapp_number: string;
          logo_url?: string | null;
          instagram_url?: string | null;
          color_primary?: string;
          color_secondary?: string;
          color_accent?: string;
          brand_colors?: string[];
          font_family?: FontFamily;
          custom_font_url?: string | null;
          custom_font_name?: string | null;
          city?: string | null;
          state?: string | null;
          craft_types?: string[];
          craft_other?: string | null;
          marketplace_opt_in?: boolean;
          marketplace_opt_in_at?: string | null;
          accepts_custom_orders?: boolean | null;
          ships_nationwide?: boolean | null;
          years_active?: string | null;
          status?: StoreStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
        Relationships: [];
      };
      /** Domínios customizados por loja (migration 0027), ex.: blessing.com.br. */
      store_domains: {
        Row: {
          id: string;
          store_id: string;
          domain: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          domain: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_domains"]["Insert"]>;
        Relationships: [];
      };
      /** Pix e precificação PRIVADOS da loja (migration 0037): RLS só para a dona. */
      store_private: {
        Row: {
          store_id: string;
          pix_key: string | null;
          monthly_pay: number;
          monthly_fixed_cost: number;
          productive_hours_per_month: number;
          tax_regime: TaxRegime;
          tax_percent: number;
          default_pricing_method: PricingMethodValue;
          default_margin_percent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          store_id: string;
          pix_key?: string | null;
          monthly_pay?: number;
          monthly_fixed_cost?: number;
          productive_hours_per_month?: number;
          tax_regime?: TaxRegime;
          tax_percent?: number;
          default_pricing_method?: PricingMethodValue;
          default_margin_percent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_private"]["Insert"]>;
        Relationships: [];
      };
      /** Billing por loja (migration 0029), 1:1 com stores. */
      store_subscriptions: {
        Row: {
          id: string;
          store_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: SubscriptionStatus;
          billing_type: BillingType;
          /** Cancelamento agendado no portal do Stripe (migration 0040). */
          cancel_at_period_end: boolean;
          price_id: string | null;
          trial_started_at: string | null;
          trial_ends_at: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: SubscriptionStatus;
          billing_type?: BillingType;
          cancel_at_period_end?: boolean;
          price_id?: string | null;
          trial_started_at?: string | null;
          trial_ends_at?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          status: ArchivableStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          status?: ArchivableStatus;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          status: ArchivableStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          status?: ArchivableStatus;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
        Relationships: [];
      };
      models: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          description: string | null;
          status: ArchivableStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          description?: string | null;
          status?: ArchivableStatus;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["models"]["Insert"]>;
        Relationships: [];
      };
      payment_methods: {
        Row: {
          id: string;
          store_id: string;
          label: string;
          fee_percent: number;
          installments: number;
          status: ArchivableStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          label: string;
          fee_percent?: number;
          installments?: number;
          status?: ArchivableStatus;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_methods"]["Insert"]>;
        Relationships: [];
      };
      product_materials: {
        Row: {
          id: string;
          product_id: string;
          material_id: string | null;
          description: string;
          quantity: number;
          unit: string;
          unit_cost: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          material_id?: string | null;
          description: string;
          quantity?: number;
          unit?: string;
          unit_cost?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_materials"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_materials_material_id_fkey";
            columns: ["material_id"];
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
        ];
      };
      materials: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          unit: string;
          unit_cost: number;
          status: ArchivableStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          unit?: string;
          unit_cost?: number;
          status?: ArchivableStatus;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          phone: string | null;
          notes: string | null;
          status: ArchivableStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          phone?: string | null;
          notes?: string | null;
          status?: ArchivableStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          customer_id: string;
          status: OrderStatus;
          order_date: string;
          expected_delivery_date: string | null;
          delivered_at: string | null;
          deposit_amount: number;
          deposit_paid_at: string | null;
          deposit_payment_method_id: string | null;
          balance_amount: number;
          balance_paid_at: string | null;
          balance_payment_method_id: string | null;
          total_amount: number;
          notes: string | null;
          production_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          customer_id: string;
          status?: OrderStatus;
          order_date?: string;
          expected_delivery_date?: string | null;
          delivered_at?: string | null;
          deposit_amount?: number;
          deposit_paid_at?: string | null;
          deposit_payment_method_id?: string | null;
          balance_amount?: number;
          balance_paid_at?: string | null;
          balance_payment_method_id?: string | null;
          total_amount?: number;
          notes?: string | null;
          production_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          custom_name: string | null;
          custom_description: string | null;
          quantity: number;
          unit_price: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          custom_name?: string | null;
          custom_description?: string | null;
          quantity?: number;
          unit_price?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      colors: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          slug: string;
          hex: string;
          hex_secondary: string | null;
          status: ArchivableStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          slug: string;
          hex: string;
          hex_secondary?: string | null;
          status?: ArchivableStatus;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["colors"]["Insert"]>;
        Relationships: [];
      };
      variant_groups: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          status: ArchivableStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          status?: ArchivableStatus;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["variant_groups"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          collection_id: string | null;
          model_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          materials: string | null;
          /** @deprecated Substituído pelos campos numéricos abaixo. A coluna
           * permanece no banco para não perder o que já foi digitado, mas o
           * cadastro não a edita e o catálogo não a exibe. */
          measurements: string | null;
          /** Peso e dimensões (migration 0012). Nulo = não informado. */
          weight_kg: number | null;
          length_cm: number | null;
          width_cm: number | null;
          height_cm: number | null;
          status: ProductStatus;
          is_featured: boolean;
          is_new_arrival: boolean;
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          /** Precificação (migration 0014) — interno, nunca exposto no catálogo. */
          production_hours: number;
          other_costs: number;
          /** null herda o padrão da loja. */
          pricing_method: PricingMethodValue | null;
          pricing_rate_percent: number | null;
          /** Vídeo curto opcional (migration 0021), separado do limite de imagens. */
          video_url: string | null;
          /** Frame do vídeo capturado no navegador, para a miniatura da galeria. */
          video_poster_url: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          category_id?: string | null;
          collection_id?: string | null;
          model_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          materials?: string | null;
          measurements?: string | null;
          weight_kg?: number | null;
          length_cm?: number | null;
          width_cm?: number | null;
          height_cm?: number | null;
          status?: ProductStatus;
          is_featured?: boolean;
          is_new_arrival?: boolean;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          production_hours?: number;
          other_costs?: number;
          pricing_method?: PricingMethodValue | null;
          pricing_rate_percent?: number | null;
          video_url?: string | null;
          video_poster_url?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_cover: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_cover?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          /** Texto livre legado; `color_id` é a fonte a partir da migration 0013. */
          color: string | null;
          color_id: string | null;
          /** Eixo de escolha: "Cor", "Alça"… (migration 0016). */
          variant_group: string | null;
          size: string | null;
          sku: string | null;
          price: number | null;
          status: VariantStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          color?: string | null;
          color_id?: string | null;
          variant_group?: string | null;
          size?: string | null;
          sku?: string | null;
          price?: number | null;
          status?: VariantStatus;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          store_id: string;
          event_type: AnalyticsEventType;
          product_id: string | null;
          category_id: string | null;
          collection_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          event_type: AnalyticsEventType;
          product_id?: string | null;
          category_id?: string | null;
          collection_id?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /** Acesso comercial em tempo real (migration 0032) — boolean, sem dados de cobrança. */
      store_has_access: {
        Args: { p_store_id: string };
        Returns: boolean;
      };
      /** Painel da plataforma (migration 0031) — e-mail do dono da loja, só para platform admin. */
      platform_admin_store_owner_email: {
        Args: { p_store_id: string };
        Returns: string | null;
      };
      /** Onboarding self-service (migration 0028) — checagem de slug sem vazar dado de loja inativa. */
      is_store_slug_available: {
        Args: { p_slug: string };
        Returns: boolean;
      };
      /** Painel da plataforma (migration 0030) — evita recursão de RLS em profiles. */
      is_platform_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_product_rankings: {
        Args: { p_store_id: string; p_days?: number | null };
        Returns: {
          product_id: string;
          product_name: string;
          views: number;
          clicks: number;
          interest_rate: number;
        }[];
      };
      get_category_rankings: {
        Args: { p_store_id: string; p_days?: number | null };
        Returns: { category_id: string; category_name: string; views: number }[];
      };
      get_collection_rankings: {
        Args: { p_store_id: string; p_days?: number | null };
        Returns: { collection_id: string; collection_name: string; views: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
