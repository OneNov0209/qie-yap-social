export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      login_nonces: {
        Row: {
          address: string
          expires_at: string
          nonce: string
        }
        Insert: {
          address: string
          expires_at?: string
          nonce: string
        }
        Update: {
          address?: string
          expires_at?: string
          nonce?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          amount: number | null
          created_at: string
          from_user_id: string | null
          id: string
          post_id: string | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          post_id?: string | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          from_user_id?: string | null
          id?: string
          post_id?: string | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          boost_expires_at: string | null
          content: string
          content_hash: string | null
          created_at: string
          id: string
          is_boosted: boolean
          is_super_yap: boolean
          on_chain: boolean
          reply_to: string | null
          tx_hash: string | null
        }
        Insert: {
          author_id: string
          boost_expires_at?: string | null
          content: string
          content_hash?: string | null
          created_at?: string
          id?: string
          is_boosted?: boolean
          is_super_yap?: boolean
          on_chain?: boolean
          reply_to?: string | null
          tx_hash?: string | null
        }
        Update: {
          author_id?: string
          boost_expires_at?: string | null
          content?: string
          content_hash?: string | null
          created_at?: string
          id?: string
          is_boosted?: boolean
          is_super_yap?: boolean
          on_chain?: boolean
          reply_to?: string | null
          tx_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string
          avatar_seed: string
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_validator: boolean
          username: string
        }
        Insert: {
          address: string
          avatar_seed: string
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          is_validator?: boolean
          username: string
        }
        Update: {
          address?: string
          avatar_seed?: string
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_validator?: boolean
          username?: string
        }
        Relationships: []
      }
      tips: {
        Row: {
          amount: number
          created_at: string
          from_user_id: string
          id: string
          post_id: string
          to_user_id: string
          tx_hash: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_user_id: string
          id?: string
          post_id: string
          to_user_id: string
          tx_hash: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_user_id?: string
          id?: string
          post_id?: string
          to_user_id?: string
          tx_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "tips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      twitter_oauth_states: {
        Row: {
          code_verifier: string
          created_at: string
          expires_at: string
          state: string
          wallet_address: string | null
        }
        Insert: {
          code_verifier: string
          created_at?: string
          expires_at?: string
          state: string
          wallet_address?: string | null
        }
        Update: {
          code_verifier?: string
          created_at?: string
          expires_at?: string
          state?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      wallet_twitter_links: {
        Row: {
          linked_at: string
          twitter_id: string
          twitter_username: string
          tx_hash: string | null
          user_id: string
          wallet_address: string
        }
        Insert: {
          linked_at?: string
          twitter_id: string
          twitter_username: string
          tx_hash?: string | null
          user_id: string
          wallet_address: string
        }
        Update: {
          linked_at?: string
          twitter_id?: string
          twitter_username?: string
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
