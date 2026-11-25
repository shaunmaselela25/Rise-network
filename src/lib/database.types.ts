export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: number;
          new_data: Json | null;
          note: string | null;
          old_data: Json | null;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: never;
          new_data?: Json | null;
          note?: string | null;
          old_data?: Json | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: never;
          new_data?: Json | null;
          note?: string | null;
          old_data?: Json | null;
        };
        Relationships: [];
      };
      career_resources: {
        Row: {
          body: string | null;
          created_at: string;
          external_url: string | null;
          id: string;
          last_reviewed_at: string | null;
          slug: string;
          status: Database['public']['Enums']['resource_status'];
          summary: string;
          title: string;
          topic: Database['public']['Enums']['career_topic'];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          body?: string | null;
          created_at?: string;
          external_url?: string | null;
          id?: string;
          last_reviewed_at?: string | null;
          slug: string;
          status?: Database['public']['Enums']['resource_status'];
          summary: string;
          title: string;
          topic: Database['public']['Enums']['career_topic'];
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          external_url?: string | null;
          id?: string;
          last_reviewed_at?: string | null;
          slug?: string;
          status?: Database['public']['Enums']['resource_status'];
          summary?: string;
          title?: string;
          topic?: Database['public']['Enums']['career_topic'];
          updated_at?: string;
        };
        Relationships: [];
      };
      consent_records: {
        Row: {
          accepted_at: string;
          document: Database['public']['Enums']['policy_document'];
          id: string;
          user_id: string;
          version: string;
        };
        ComputedFields: never;
        Insert: {
          accepted_at?: string;
          document: Database['public']['Enums']['policy_document'];
          id?: string;
          user_id: string;
          version: string;
        };
        Update: {
          accepted_at?: string;
          document?: Database['public']['Enums']['policy_document'];
          id?: string;
          user_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'consent_records_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      learning_categories: {
        Row: {
          code: string;
          created_at: string;
          is_active: boolean;
          label: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          is_active?: boolean;
          label: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          is_active?: boolean;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      learning_resources: {
        Row: {
          category_code: string;
          cost: Database['public']['Enums']['cost_type'];
          created_at: string;
          description: string;
          duration_text: string | null;
          format: Database['public']['Enums']['learning_format'];
          id: string;
          last_reviewed_at: string | null;
          level: Database['public']['Enums']['learning_level'];
          provider_name: string;
          requirements: string | null;
          status: Database['public']['Enums']['resource_status'];
          title: string;
          updated_at: string;
          url: string;
        };
        ComputedFields: never;
        Insert: {
          category_code: string;
          cost?: Database['public']['Enums']['cost_type'];
          created_at?: string;
          description: string;
          duration_text?: string | null;
          format: Database['public']['Enums']['learning_format'];
          id?: string;
          last_reviewed_at?: string | null;
          level?: Database['public']['Enums']['learning_level'];
          provider_name: string;
          requirements?: string | null;
          status?: Database['public']['Enums']['resource_status'];
          title: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          category_code?: string;
          cost?: Database['public']['Enums']['cost_type'];
          created_at?: string;
          description?: string;
          duration_text?: string | null;
          format?: Database['public']['Enums']['learning_format'];
          id?: string;
          last_reviewed_at?: string | null;
          level?: Database['public']['Enums']['learning_level'];
          provider_name?: string;
          requirements?: string | null;
          status?: Database['public']['Enums']['resource_status'];
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_resources_category_code_fkey';
            columns: ['category_code'];
            isOneToOne: false;
            referencedRelation: 'learning_categories';
            referencedColumns: ['code'];
          },
        ];
      };
      opportunities: {
        Row: {
          age_max: number | null;
          age_min: number | null;
          application_instructions: string | null;
          application_url: string | null;
          category_code: string;
          closes_at: string | null;
          contact_info: string | null;
          created_at: string;
          delivery_mode: Database['public']['Enums']['delivery_mode'] | null;
          description: string;
          duration_text: string | null;
          eligibility: string | null;
          financial_details: string | null;
          id: string;
          last_checked_at: string | null;
          location_text: string | null;
          min_qualification: Database['public']['Enums']['qualification_level'] | null;
          municipality: string | null;
          opens_at: string | null;
          opportunity_type: Database['public']['Enums']['opportunity_type'];
          provider_name: string;
          provider_url: string | null;
          province: Database['public']['Enums']['province'] | null;
          published_at: string | null;
          required_documents: string | null;
          required_skills: string | null;
          search_vector: unknown;
          slug: string;
          source_url: string;
          status: Database['public']['Enums']['opportunity_status'];
          submitted_by: string | null;
          summary: string;
          title: string;
          updated_at: string;
          verification_notes: string | null;
          verification_status: Database['public']['Enums']['verification_status'];
        };
        ComputedFields: never;
        Insert: {
          age_max?: number | null;
          age_min?: number | null;
          application_instructions?: string | null;
          application_url?: string | null;
          category_code: string;
          closes_at?: string | null;
          contact_info?: string | null;
          created_at?: string;
          delivery_mode?: Database['public']['Enums']['delivery_mode'] | null;
          description: string;
          duration_text?: string | null;
          eligibility?: string | null;
          financial_details?: string | null;
          id?: string;
          last_checked_at?: string | null;
          location_text?: string | null;
          min_qualification?: Database['public']['Enums']['qualification_level'] | null;
          municipality?: string | null;
          opens_at?: string | null;
          opportunity_type: Database['public']['Enums']['opportunity_type'];
          provider_name: string;
          provider_url?: string | null;
          province?: Database['public']['Enums']['province'] | null;
          published_at?: string | null;
          required_documents?: string | null;
          required_skills?: string | null;
          search_vector?: never;
          slug?: string;
          source_url: string;
          status?: Database['public']['Enums']['opportunity_status'];
          submitted_by?: string | null;
          summary: string;
          title: string;
          updated_at?: string;
          verification_notes?: string | null;
          verification_status?: Database['public']['Enums']['verification_status'];
        };
        Update: {
          age_max?: number | null;
          age_min?: number | null;
          application_instructions?: string | null;
          application_url?: string | null;
          category_code?: string;
          closes_at?: string | null;
          contact_info?: string | null;
          created_at?: string;
          delivery_mode?: Database['public']['Enums']['delivery_mode'] | null;
          description?: string;
          duration_text?: string | null;
          eligibility?: string | null;
          financial_details?: string | null;
          id?: string;
          last_checked_at?: string | null;
          location_text?: string | null;
          min_qualification?: Database['public']['Enums']['qualification_level'] | null;
          municipality?: string | null;
          opens_at?: string | null;
          opportunity_type?: Database['public']['Enums']['opportunity_type'];
          provider_name?: string;
          provider_url?: string | null;
          province?: Database['public']['Enums']['province'] | null;
          published_at?: string | null;
          required_documents?: string | null;
          required_skills?: string | null;
          search_vector?: never;
          slug?: string;
          source_url?: string;
          status?: Database['public']['Enums']['opportunity_status'];
          submitted_by?: string | null;
          summary?: string;
          title?: string;
          updated_at?: string;
          verification_notes?: string | null;
          verification_status?: Database['public']['Enums']['verification_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'opportunities_category_code_fkey';
            columns: ['category_code'];
            isOneToOne: false;
            referencedRelation: 'opportunity_categories';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'opportunities_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      opportunity_categories: {
        Row: {
          code: string;
          created_at: string;
          is_active: boolean;
          label: string;
          sort_order: number;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          created_at?: string;
          is_active?: boolean;
          label: string;
          sort_order?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          is_active?: boolean;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      opportunity_reviews: {
        Row: {
          action: Database['public']['Enums']['review_action'];
          created_at: string;
          from_status: Database['public']['Enums']['opportunity_status'];
          id: string;
          note: string | null;
          opportunity_id: string;
          reviewer_id: string | null;
          to_status: Database['public']['Enums']['opportunity_status'];
          verification_status: Database['public']['Enums']['verification_status'];
        };
        ComputedFields: never;
        Insert: {
          action: Database['public']['Enums']['review_action'];
          created_at?: string;
          from_status: Database['public']['Enums']['opportunity_status'];
          id?: string;
          note?: string | null;
          opportunity_id: string;
          reviewer_id?: string | null;
          to_status: Database['public']['Enums']['opportunity_status'];
          verification_status: Database['public']['Enums']['verification_status'];
        };
        Update: {
          action?: Database['public']['Enums']['review_action'];
          created_at?: string;
          from_status?: Database['public']['Enums']['opportunity_status'];
          id?: string;
          note?: string | null;
          opportunity_id?: string;
          reviewer_id?: string | null;
          to_status?: Database['public']['Enums']['opportunity_status'];
          verification_status?: Database['public']['Enums']['verification_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'opportunity_reviews_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunity_reviews_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'public_opportunities';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          age_confirmed_at: string;
          created_at: string;
          display_name: string;
          education_level: Database['public']['Enums']['qualification_level'] | null;
          id: string;
          interests: string[];
          province: Database['public']['Enums']['province'] | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          age_confirmed_at: string;
          created_at?: string;
          display_name: string;
          education_level?: Database['public']['Enums']['qualification_level'] | null;
          id: string;
          interests?: string[];
          province?: Database['public']['Enums']['province'] | null;
          updated_at?: string;
        };
        Update: {
          age_confirmed_at?: string;
          created_at?: string;
          display_name?: string;
          education_level?: Database['public']['Enums']['qualification_level'] | null;
          id?: string;
          interests?: string[];
          province?: Database['public']['Enums']['province'] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          opportunity_id: string;
          reason: Database['public']['Enums']['report_reason'];
          reporter_id: string | null;
          resolution_note: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database['public']['Enums']['report_status'];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          opportunity_id: string;
          reason: Database['public']['Enums']['report_reason'];
          reporter_id?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database['public']['Enums']['report_status'];
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          opportunity_id?: string;
          reason?: Database['public']['Enums']['report_reason'];
          reporter_id?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database['public']['Enums']['report_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'reports_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'public_opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_reporter_id_fkey';
            columns: ['reporter_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_opportunities: {
        Row: {
          created_at: string;
          opportunity_id: string;
          tracking_status: Database['public']['Enums']['tracking_status'];
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          opportunity_id: string;
          tracking_status?: Database['public']['Enums']['tracking_status'];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          opportunity_id?: string;
          tracking_status?: Database['public']['Enums']['tracking_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_opportunities_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_opportunities_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'public_opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_opportunities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          granted_at?: string;
          granted_by?: string | null;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string | null;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      public_opportunities: {
        Row: {
          age_max: number | null;
          age_min: number | null;
          application_instructions: string | null;
          application_url: string | null;
          category_code: string;
          closes_at: string | null;
          contact_info: string | null;
          delivery_mode: Database['public']['Enums']['delivery_mode'] | null;
          description: string;
          duration_text: string | null;
          eligibility: string | null;
          financial_details: string | null;
          id: string;
          is_closed: boolean | null;
          last_checked_at: string | null;
          location_text: string | null;
          min_qualification: Database['public']['Enums']['qualification_level'] | null;
          municipality: string | null;
          opens_at: string | null;
          opportunity_type: Database['public']['Enums']['opportunity_type'];
          provider_name: string;
          provider_url: string | null;
          province: Database['public']['Enums']['province'] | null;
          published_at: string | null;
          required_documents: string | null;
          required_skills: string | null;
          search_vector: unknown;
          slug: string;
          source_url: string;
          summary: string;
          title: string;
          updated_at: string;
          verification_status: Database['public']['Enums']['verification_status'];
        };
        ComputedFields: never;
        Insert: {
          age_max?: number | null;
          age_min?: number | null;
          application_instructions?: string | null;
          application_url?: string | null;
          category_code?: string | null;
          closes_at?: string | null;
          contact_info?: string | null;
          delivery_mode?: Database['public']['Enums']['delivery_mode'] | null;
          description?: string | null;
          duration_text?: string | null;
          eligibility?: string | null;
          financial_details?: string | null;
          id?: string | null;
          is_closed?: never;
          last_checked_at?: string | null;
          location_text?: string | null;
          min_qualification?: Database['public']['Enums']['qualification_level'] | null;
          municipality?: string | null;
          opens_at?: string | null;
          opportunity_type?: Database['public']['Enums']['opportunity_type'] | null;
          provider_name?: string | null;
          provider_url?: string | null;
          province?: Database['public']['Enums']['province'] | null;
          published_at?: string | null;
          required_documents?: string | null;
          required_skills?: string | null;
          search_vector?: unknown;
          slug?: string | null;
          source_url?: string | null;
          summary?: string | null;
          title?: string | null;
          updated_at?: string | null;
          verification_status?: Database['public']['Enums']['verification_status'] | null;
        };
        Update: {
          age_max?: number | null;
          age_min?: number | null;
          application_instructions?: string | null;
          application_url?: string | null;
          category_code?: string | null;
          closes_at?: string | null;
          contact_info?: string | null;
          delivery_mode?: Database['public']['Enums']['delivery_mode'] | null;
          description?: string | null;
          duration_text?: string | null;
          eligibility?: string | null;
          financial_details?: string | null;
          id?: string | null;
          is_closed?: never;
          last_checked_at?: string | null;
          location_text?: string | null;
          min_qualification?: Database['public']['Enums']['qualification_level'] | null;
          municipality?: string | null;
          opens_at?: string | null;
          opportunity_type?: Database['public']['Enums']['opportunity_type'] | null;
          provider_name?: string | null;
          provider_url?: string | null;
          province?: Database['public']['Enums']['province'] | null;
          published_at?: string | null;
          required_documents?: string | null;
          required_skills?: string | null;
          search_vector?: unknown;
          slug?: string | null;
          source_url?: string | null;
          summary?: string | null;
          title?: string | null;
          updated_at?: string | null;
          verification_status?: Database['public']['Enums']['verification_status'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'opportunities_category_code_fkey';
            columns: ['category_code'];
            isOneToOne: false;
            referencedRelation: 'opportunity_categories';
            referencedColumns: ['code'];
          },
        ];
      };
    };
    Functions: {
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      resolve_report: {
        Args: {
          note?: string;
          outcome: Database['public']['Enums']['report_status'];
          report: string;
        };
        Returns: undefined;
      };
      review_opportunity: {
        Args: {
          new_verification?: Database['public']['Enums']['verification_status'];
          note?: string;
          opportunity: string;
          review: Database['public']['Enums']['review_action'];
        };
        Returns: Database['public']['Enums']['opportunity_status'];
      };
      set_user_role: {
        Args: {
          should_have: boolean;
          target_role: Database['public']['Enums']['app_role'];
          target_user: string;
        };
        Returns: undefined;
      };
      submit_opportunity: {
        Args: { opportunity: string };
        Returns: Database['public']['Enums']['opportunity_status'];
      };
    };
    Enums: {
      app_role: 'moderator' | 'admin';
      career_topic:
        | 'cv'
        | 'interview'
        | 'workplace_readiness'
        | 'communication'
        | 'career_exploration'
        | 'career_pathways'
        | 'portfolio'
        | 'job_search'
        | 'professional_skills';
      cost_type: 'free' | 'paid' | 'funded' | 'unknown';
      delivery_mode: 'in_person' | 'remote' | 'hybrid';
      learning_format: 'online_self_paced' | 'online_live' | 'in_person' | 'blended';
      learning_level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';
      opportunity_status:
        'draft' | 'pending_review' | 'changes_requested' | 'rejected' | 'published' | 'archived';
      opportunity_type:
        | 'scholarship'
        | 'bursary'
        | 'internship'
        | 'learnership'
        | 'graduate_programme'
        | 'entry_level_job'
        | 'training'
        | 'skills_programme'
        | 'apprenticeship'
        | 'education_programme'
        | 'competition'
        | 'entrepreneurship'
        | 'grant'
        | 'volunteering'
        | 'event'
        | 'other';
      policy_document: 'terms' | 'privacy';
      province:
        | 'eastern_cape'
        | 'free_state'
        | 'gauteng'
        | 'kwazulu_natal'
        | 'limpopo'
        | 'mpumalanga'
        | 'north_west'
        | 'northern_cape'
        | 'western_cape'
        | 'national'
        | 'online';
      qualification_level:
        'none' | 'grade_9' | 'matric' | 'certificate' | 'diploma' | 'degree' | 'postgraduate';
      report_reason: 'suspicious' | 'incorrect' | 'expired' | 'other';
      report_status: 'open' | 'dismissed' | 'actioned';
      resource_status: 'draft' | 'published' | 'archived';
      review_action:
        'request_changes' | 'reject' | 'publish' | 'unpublish' | 'archive' | 'set_verification';
      tracking_status: 'interested' | 'applying' | 'applied' | 'not_proceeding';
      verification_status:
        'unverified' | 'source_checked' | 'provider_confirmed' | 'needs_recheck' | 'disputed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ['moderator', 'admin'],
      career_topic: [
        'cv',
        'interview',
        'workplace_readiness',
        'communication',
        'career_exploration',
        'career_pathways',
        'portfolio',
        'job_search',
        'professional_skills',
      ],
      cost_type: ['free', 'paid', 'funded', 'unknown'],
      delivery_mode: ['in_person', 'remote', 'hybrid'],
      learning_format: ['online_self_paced', 'online_live', 'in_person', 'blended'],
      learning_level: ['beginner', 'intermediate', 'advanced', 'all_levels'],
      opportunity_status: [
        'draft',
        'pending_review',
        'changes_requested',
        'rejected',
        'published',
        'archived',
      ],
      opportunity_type: [
        'scholarship',
        'bursary',
        'internship',
        'learnership',
        'graduate_programme',
        'entry_level_job',
        'training',
        'skills_programme',
        'apprenticeship',
        'education_programme',
        'competition',
        'entrepreneurship',
        'grant',
        'volunteering',
        'event',
        'other',
      ],
      policy_document: ['terms', 'privacy'],
      province: [
        'eastern_cape',
        'free_state',
        'gauteng',
        'kwazulu_natal',
        'limpopo',
        'mpumalanga',
        'north_west',
        'northern_cape',
        'western_cape',
        'national',
        'online',
      ],
      qualification_level: [
        'none',
        'grade_9',
        'matric',
        'certificate',
        'diploma',
        'degree',
        'postgraduate',
      ],
      report_reason: ['suspicious', 'incorrect', 'expired', 'other'],
      report_status: ['open', 'dismissed', 'actioned'],
      resource_status: ['draft', 'published', 'archived'],
      review_action: [
        'request_changes',
        'reject',
        'publish',
        'unpublish',
        'archive',
        'set_verification',
      ],
      tracking_status: ['interested', 'applying', 'applied', 'not_proceeding'],
      verification_status: [
        'unverified',
        'source_checked',
        'provider_confirmed',
        'needs_recheck',
        'disputed',
      ],
    },
  },
} as const;
