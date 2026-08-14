// Tipos gerados manualmente a partir das migrations em supabase/migrations/.
// Para regenerar via CLI: `npx supabase login` e depois
// `npx supabase gen types typescript --project-id bipadxpcbmgoatlnnyfw > types/database.types.ts`

export type ProductStatus = "available" | "made_to_order" | "sold_out" | "inactive";
export type VariantStatus = "available" | "sold_out" | "archived";
export type ArchivableStatus = "active" | "archived";
export type StoreStatus = "active" | "inactive";
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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
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
          /** Precificação (migration 0014) — valores mensais, nunca por hora. */
          monthly_pay: number;
          monthly_fixed_cost: number;
          productive_hours_per_month: number;
          tax_regime: TaxRegime;
          tax_percent: number;
          default_pricing_method: PricingMethodValue;
          default_margin_percent: number;
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
          monthly_pay?: number;
          monthly_fixed_cost?: number;
          productive_hours_per_month?: number;
          tax_regime?: TaxRegime;
          tax_percent?: number;
          default_pricing_method?: PricingMethodValue;
          default_margin_percent?: number;
          status?: StoreStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
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
          description: string;
          quantity?: number;
          unit?: string;
          unit_cost?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_materials"]["Insert"]>;
        Relationships: [];
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
