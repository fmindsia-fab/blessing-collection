// Tipos gerados manualmente a partir das migrations em supabase/migrations/.
// Para regenerar via CLI: `npx supabase login` e depois
// `npx supabase gen types typescript --project-id bipadxpcbmgoatlnnyfw > types/database.types.ts`

export type ProductStatus = "available" | "made_to_order" | "sold_out" | "inactive";
export type VariantStatus = "available" | "sold_out";
export type ArchivableStatus = "active" | "archived";
export type StoreStatus = "active" | "inactive";
export type FontFamily =
  | "playfair-display"
  | "cormorant-garamond"
  | "lora"
  | "montserrat"
  | "inter";
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
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
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
          font_family: FontFamily;
          status: StoreStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stores"]["Row"]> & {
          owner_user_id: string;
          slug: string;
          name: string;
          whatsapp_number: string;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & {
          store_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["collections"]["Row"]> & {
          store_id: string;
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          collection_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          materials: string | null;
          measurements: string | null;
          status: ProductStatus;
          is_featured: boolean;
          is_new_arrival: boolean;
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          store_id: string;
          name: string;
          slug: string;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & {
          product_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          color: string | null;
          size: string | null;
          sku: string | null;
          price: number | null;
          status: VariantStatus;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_variants"]["Row"]> & {
          product_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
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
        Insert: Partial<Database["public"]["Tables"]["analytics_events"]["Row"]> & {
          store_id: string;
          event_type: AnalyticsEventType;
        };
        Update: never;
      };
    };
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
  };
}
