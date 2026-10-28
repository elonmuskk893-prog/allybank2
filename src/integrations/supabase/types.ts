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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          available: number
          balance: number
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          available?: number
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          available?: number
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_codes: {
        Row: {
          active: boolean
          code_hash: string
          created_at: string
          id: string
          label: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          code_hash: string
          created_at?: string
          id?: string
          label?: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          code_hash?: string
          created_at?: string
          id?: string
          label?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      admin_tasks: {
        Row: {
          assignee: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          priority: string
          status: string
          title: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_label: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_label?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          account_number: string | null
          bank: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          name: string
          nickname: string | null
          routing: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          bank?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          name: string
          nickname?: string | null
          routing?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          bank?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          name?: string
          nickname?: string | null
          routing?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      card_applications: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_zip: string | null
          card_brand: string | null
          card_level: string | null
          card_type: string
          created_at: string
          currency: string | null
          daily_limit: number | null
          id: string
          status: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_zip?: string | null
          card_brand?: string | null
          card_level?: string | null
          card_type?: string
          created_at?: string
          currency?: string | null
          daily_limit?: number | null
          id?: string
          status?: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_zip?: string | null
          card_brand?: string | null
          card_level?: string | null
          card_type?: string
          created_at?: string
          currency?: string | null
          daily_limit?: number | null
          id?: string
          status?: Database["public"]["Enums"]["req_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          brand: string
          card_type: string
          created_at: string
          expiry: string
          frozen: boolean
          holder: string
          id: string
          last4: string
          limit_amount: number | null
          spent: number
          status: Database["public"]["Enums"]["card_status"]
          user_id: string
        }
        Insert: {
          brand?: string
          card_type?: string
          created_at?: string
          expiry: string
          frozen?: boolean
          holder: string
          id?: string
          last4: string
          limit_amount?: number | null
          spent?: number
          status?: Database["public"]["Enums"]["card_status"]
          user_id: string
        }
        Update: {
          brand?: string
          card_type?: string
          created_at?: string
          expiry?: string
          frozen?: boolean
          holder?: string
          id?: string
          last4?: string
          limit_amount?: number | null
          spent?: number
          status?: Database["public"]["Enums"]["card_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      crypto_assets: {
        Row: {
          balance: number
          created_at: string
          id: string
          name: string
          price_usd: number | null
          symbol: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          name?: string
          price_usd?: number | null
          symbol: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          name?: string
          price_usd?: number | null
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_assets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          reference: string | null
          status: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method: string
          reference?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          enabled: boolean
          id: string
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          enabled?: boolean
          id?: string
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          enabled?: boolean
          id?: string
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      grant_programs: {
        Row: {
          bullets: Json
          created_at: string
          description: string
          enabled: boolean
          icon: string
          id: string
          max_amount: number | null
          sort_order: number
          tint: string
          title: string
          updated_at: string
        }
        Insert: {
          bullets?: Json
          created_at?: string
          description?: string
          enabled?: boolean
          icon?: string
          id?: string
          max_amount?: number | null
          sort_order?: number
          tint?: string
          title: string
          updated_at?: string
        }
        Update: {
          bullets?: Json
          created_at?: string
          description?: string
          enabled?: boolean
          icon?: string
          id?: string
          max_amount?: number | null
          sort_order?: number
          tint?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      grants: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          program: string
          status: Database["public"]["Enums"]["grant_status"]
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          program: string
          status?: Database["public"]["Enums"]["grant_status"]
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          program?: string
          status?: Database["public"]["Enums"]["grant_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      irs_refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          status: string
          tax_year: number
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          tax_year?: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          tax_year?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "irs_refunds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          amount: number
          created_at: string
          id: string
          interest_rate: number
          status: Database["public"]["Enums"]["loan_status"]
          term_months: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          interest_rate?: number
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          interest_rate?: number
          status?: Database["public"]["Enums"]["loan_status"]
          term_months?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          starts_at: string | null
          status: string
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          tier?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          starts_at?: string | null
          status?: string
          tier?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          icon: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      password_resets: {
        Row: {
          code_hash: string
          created_at: string
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          charges_amount: number
          charges_type: string | null
          created_at: string
          custom_fields: Json
          duration: string | null
          emoji: string
          enabled: boolean
          id: string
          instructions: string | null
          maximum: number
          minimum: number
          name: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          charges_amount?: number
          charges_type?: string | null
          created_at?: string
          custom_fields?: Json
          duration?: string | null
          emoji?: string
          enabled?: boolean
          id: string
          instructions?: string | null
          maximum?: number
          minimum?: number
          name: string
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          charges_amount?: number
          charges_type?: string | null
          created_at?: string
          custom_fields?: Json
          duration?: string | null
          emoji?: string
          enabled?: boolean
          id?: string
          instructions?: string | null
          maximum?: number
          minimum?: number
          name?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          currency: string
          language: string
          notifications: Json
          security: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          currency?: string
          language?: string
          notifications?: Json
          security?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          currency?: string
          language?: string
          notifications?: Json
          security?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_currencies: {
        Row: {
          code: string
          created_at: string
          enabled: boolean
          id: string
          name: string
          rate: number
          symbol: string
        }
        Insert: {
          code: string
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          rate?: number
          symbol?: string
        }
        Update: {
          code?: string
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          rate?: number
          symbol?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          brand_color: string
          created_at: string
          id: number
          kyc_required: boolean
          logo_url: string | null
          name: string
          primary_currency: string
          slug: string
        }
        Insert: {
          brand_color?: string
          created_at?: string
          id?: number
          kyc_required?: boolean
          logo_url?: string | null
          name?: string
          primary_currency?: string
          slug: string
        }
        Update: {
          brand_color?: string
          created_at?: string
          id?: number
          kyc_required?: boolean
          logo_url?: string | null
          name?: string
          primary_currency?: string
          slug?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender: string
          ticket_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender?: string
          ticket_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string | null
          created_at: string
          id: string
          status: string
          subject: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id: string
          status?: string
          subject: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          status?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          author: string
          created_at: string
          enabled: boolean
          id: string
          quote: string
          rating: number
          role: string | null
        }
        Insert: {
          author: string
          created_at?: string
          enabled?: boolean
          id?: string
          quote: string
          rating?: number
          role?: string | null
        }
        Update: {
          author?: string
          created_at?: string
          enabled?: boolean
          id?: string
          quote?: string
          rating?: number
          role?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          balance_after: number | null
          confirmation_code: string | null
          confirmation_code_expires_at: string | null
          confirmation_code_generated_at: string | null
          confirmation_code_used_at: string | null
          created_at: string
          currency: string
          direction: Database["public"]["Enums"]["tx_direction"]
          fee: number
          hold_released_at: string | null
          hold_settled_at: string | null
          id: string
          kind: Database["public"]["Enums"]["tx_kind"]
          name: string | null
          reference: string | null
          status: Database["public"]["Enums"]["tx_status"]
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          balance_after?: number | null
          confirmation_code?: string | null
          confirmation_code_expires_at?: string | null
          confirmation_code_generated_at?: string | null
          confirmation_code_used_at?: string | null
          created_at?: string
          currency?: string
          direction: Database["public"]["Enums"]["tx_direction"]
          fee?: number
          hold_released_at?: string | null
          hold_settled_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["tx_kind"]
          name?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          balance_after?: number | null
          confirmation_code?: string | null
          confirmation_code_expires_at?: string | null
          confirmation_code_generated_at?: string | null
          confirmation_code_used_at?: string | null
          created_at?: string
          currency?: string
          direction?: Database["public"]["Enums"]["tx_direction"]
          fee?: number
          hold_released_at?: string | null
          hold_settled_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["tx_kind"]
          name?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      twofa_codes: {
        Row: {
          challenge: string
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          challenge: string
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          challenge?: string
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "twofa_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_number: string | null
          country: string | null
          created_at: string
          currency: string | null
          email: string
          email_verified_at: string | null
          first_name: string
          full_name: string | null
          id: string
          kyc_required: boolean
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_name: string
          phone: string | null
          photo_url: string | null
          pin_gate: boolean
          pin_hash: string | null
          referral_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          twofa_enabled: boolean
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email: string
          email_verified_at?: string | null
          first_name?: string
          full_name?: string | null
          id: string
          kyc_required?: boolean
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          pin_gate?: boolean
          pin_hash?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          twofa_enabled?: boolean
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          email?: string
          email_verified_at?: string | null
          first_name?: string
          full_name?: string | null
          id?: string
          kyc_required?: boolean
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          pin_gate?: boolean
          pin_hash?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          twofa_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_number: string | null
          amount: number
          confirmation_code: string | null
          confirmation_code_expires_at: string | null
          confirmation_code_generated_at: string | null
          confirmation_code_used_at: string | null
          created_at: string
          currency: string
          hold_released_at: string | null
          hold_settled_at: string | null
          id: string
          method: string
          reference: string | null
          status: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Insert: {
          account_number?: string | null
          amount: number
          confirmation_code?: string | null
          confirmation_code_expires_at?: string | null
          confirmation_code_generated_at?: string | null
          confirmation_code_used_at?: string | null
          created_at?: string
          currency?: string
          hold_released_at?: string | null
          hold_settled_at?: string | null
          id?: string
          method: string
          reference?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          confirmation_code?: string | null
          confirmation_code_expires_at?: string | null
          confirmation_code_generated_at?: string | null
          confirmation_code_used_at?: string | null
          created_at?: string
          currency?: string
          hold_released_at?: string | null
          hold_settled_at?: string | null
          id?: string
          method?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["req_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accounts_self_update_allowed: {
        Args: {
          p_available: number
          p_balance: number
          p_currency: string
          p_id: string
          p_status: Database["public"]["Enums"]["account_status"]
          p_user_id: string
        }
        Returns: boolean
      }
      cards_self_update_allowed: {
        Args: {
          p_id: string
          p_limit: number
          p_spent: number
          p_status: Database["public"]["Enums"]["card_status"]
          p_user_id: string
        }
        Returns: boolean
      }
      credit_account: {
        Args: { p_amount: number; p_currency?: string; p_user_id: string }
        Returns: {
          account_number: string | null
          available: number
          balance: number
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      debit_account: {
        Args: { p_amount: number; p_currency?: string; p_user_id: string }
        Returns: {
          account_number: string | null
          available: number
          balance: number
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_account_number: { Args: never; Returns: string }
      hold_funds: {
        Args: { p_amount: number; p_currency?: string; p_user_id: string }
        Returns: {
          account_number: string | null
          available: number
          balance: number
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: never; Returns: boolean }
      is_self: { Args: { p_user_id: string }; Returns: boolean }
      record_transaction: {
        Args: {
          p_account_id: string
          p_amount: number
          p_balance_after?: number
          p_currency?: string
          p_direction: Database["public"]["Enums"]["tx_direction"]
          p_fee?: number
          p_kind: Database["public"]["Enums"]["tx_kind"]
          p_name?: string
          p_reference?: string
          p_status?: Database["public"]["Enums"]["tx_status"]
          p_user_id: string
        }
        Returns: {
          account_id: string | null
          amount: number
          balance_after: number | null
          confirmation_code: string | null
          confirmation_code_expires_at: string | null
          confirmation_code_generated_at: string | null
          confirmation_code_used_at: string | null
          created_at: string
          currency: string
          direction: Database["public"]["Enums"]["tx_direction"]
          fee: number
          hold_released_at: string | null
          hold_settled_at: string | null
          id: string
          kind: Database["public"]["Enums"]["tx_kind"]
          name: string | null
          reference: string | null
          status: Database["public"]["Enums"]["tx_status"]
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      release_hold: {
        Args: { p_amount: number; p_currency?: string; p_user_id: string }
        Returns: {
          account_number: string | null
          available: number
          balance: number
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      settings_self_update_allowed: {
        Args: { p_security: Json; p_user_id: string }
        Returns: boolean
      }
      settle_hold: {
        Args: { p_amount: number; p_currency?: string; p_user_id: string }
        Returns: {
          account_number: string | null
          available: number
          balance: number
          created_at: string
          currency: string
          id: string
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      users_self_update_allowed: {
        Args: {
          p_account_number: string
          p_email: string
          p_id: string
          p_kyc_required: boolean
          p_kyc_status: Database["public"]["Enums"]["kyc_status"]
          p_pin_gate: boolean
          p_pin_hash: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_status: Database["public"]["Enums"]["user_status"]
          p_twofa: boolean
        }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "active" | "frozen" | "closed"
      card_status: "active" | "frozen" | "blocked" | "expired"
      grant_status: "pending" | "approved" | "paid" | "rejected"
      kyc_status:
        | "pending"
        | "in_review"
        | "verified"
        | "rejected"
        | "not_submitted"
      loan_status: "pending" | "approved" | "active" | "paid" | "rejected"
      req_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "rejected"
        | "cancelled"
      tx_direction: "credit" | "debit"
      tx_kind:
        | "deposit"
        | "withdrawal"
        | "transfer"
        | "card-spend"
        | "card-refund"
        | "fee"
        | "loan-repay"
        | "plan-debit"
        | "credited"
        | "grant"
        | "adjustment"
      tx_status: "pending" | "completed" | "failed" | "cancelled"
      user_role: "user" | "admin"
      user_status: "active" | "suspended" | "disabled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "frozen", "closed"],
      card_status: ["active", "frozen", "blocked", "expired"],
      grant_status: ["pending", "approved", "paid", "rejected"],
      kyc_status: [
        "pending",
        "in_review",
        "verified",
        "rejected",
        "not_submitted",
      ],
      loan_status: ["pending", "approved", "active", "paid", "rejected"],
      req_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "rejected",
        "cancelled",
      ],
      tx_direction: ["credit", "debit"],
      tx_kind: [
        "deposit",
        "withdrawal",
        "transfer",
        "card-spend",
        "card-refund",
        "fee",
        "loan-repay",
        "plan-debit",
        "credited",
        "grant",
        "adjustment",
      ],
      tx_status: ["pending", "completed", "failed", "cancelled"],
      user_role: ["user", "admin"],
      user_status: ["active", "suspended", "disabled"],
    },
  },
} as const
