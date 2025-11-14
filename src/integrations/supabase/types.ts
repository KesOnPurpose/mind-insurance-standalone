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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_conversations: {
        Row: {
          agent_response: string
          agent_type: string
          confidence_score: number | null
          conversation_turn: number | null
          created_at: string | null
          detected_intent: string | null
          handoff_context: Json | null
          handoff_from_agent: string | null
          handoff_reason: string | null
          id: string
          is_handoff: boolean | null
          message_embedding: string | null
          response_time_ms: number | null
          session_id: string | null
          tokens_used: number | null
          user_context: Json | null
          user_id: string
          user_message: string
        }
        Insert: {
          agent_response: string
          agent_type: string
          confidence_score?: number | null
          conversation_turn?: number | null
          created_at?: string | null
          detected_intent?: string | null
          handoff_context?: Json | null
          handoff_from_agent?: string | null
          handoff_reason?: string | null
          id?: string
          is_handoff?: boolean | null
          message_embedding?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_context?: Json | null
          user_id: string
          user_message: string
        }
        Update: {
          agent_response?: string
          agent_type?: string
          confidence_score?: number | null
          conversation_turn?: number | null
          created_at?: string | null
          detected_intent?: string | null
          handoff_context?: Json | null
          handoff_from_agent?: string | null
          handoff_reason?: string | null
          id?: string
          is_handoff?: boolean | null
          message_embedding?: string | null
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_context?: Json | null
          user_id?: string
          user_message?: string
        }
        Relationships: []
      }
      ai_weekly_summaries: {
        Row: {
          ai_insights: Json | null
          created_at: string | null
          executive_summary: string | null
          generated_at: string | null
          id: string
          is_latest: boolean | null
          title: string | null
          updated_at: string | null
          user_id: string
          week_end_date: string
          week_number: number
          week_start_date: string
        }
        Insert: {
          ai_insights?: Json | null
          created_at?: string | null
          executive_summary?: string | null
          generated_at?: string | null
          id?: string
          is_latest?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          week_end_date: string
          week_number: number
          week_start_date: string
        }
        Update: {
          ai_insights?: Json | null
          created_at?: string | null
          executive_summary?: string | null
          generated_at?: string | null
          id?: string
          is_latest?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          week_end_date?: string
          week_number?: number
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_weekly_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ai_weekly_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_recommendations: {
        Row: {
          action_items: string[]
          assessment_week: number | null
          collision_type: string | null
          created_at: string | null
          description: string
          display_order: number | null
          id: string
          is_active: boolean | null
          priority: number | null
          score_range_max: number
          score_range_min: number
          title: string
          updated_at: string | null
          video_reference: string | null
        }
        Insert: {
          action_items: string[]
          assessment_week?: number | null
          collision_type?: string | null
          created_at?: string | null
          description: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          score_range_max: number
          score_range_min: number
          title: string
          updated_at?: string | null
          video_reference?: string | null
        }
        Update: {
          action_items?: string[]
          assessment_week?: number | null
          collision_type?: string | null
          created_at?: string | null
          description?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          score_range_max?: number
          score_range_min?: number
          title?: string
          updated_at?: string | null
          video_reference?: string | null
        }
        Relationships: []
      }
      avatar_assessment_answers: {
        Row: {
          answer_option: string | null
          answer_text: string | null
          answered_at: string | null
          assessment_id: string | null
          created_at: string | null
          id: string
          points_awarded: Json | null
          question_number: number
          question_part: string
          question_text: string
          user_id: string
        }
        Insert: {
          answer_option?: string | null
          answer_text?: string | null
          answered_at?: string | null
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          points_awarded?: Json | null
          question_number: number
          question_part: string
          question_text: string
          user_id: string
        }
        Update: {
          answer_option?: string | null
          answer_text?: string | null
          answered_at?: string | null
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          points_awarded?: Json | null
          question_number?: number
          question_part?: string
          question_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatar_assessment_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "avatar_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar_assessments: {
        Row: {
          avatar_narrative: string | null
          avatar_type: string
          breakthrough_path: string | null
          collision_blueprint: string | null
          compass_crisis_score: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          neural_protocol: string | null
          past_prison_score: number | null
          primary_pattern: string
          sub_pattern_scores: Json | null
          success_sabotage_score: number | null
          temperament: string
          temperament_scores: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_narrative?: string | null
          avatar_type: string
          breakthrough_path?: string | null
          collision_blueprint?: string | null
          compass_crisis_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          neural_protocol?: string | null
          past_prison_score?: number | null
          primary_pattern: string
          sub_pattern_scores?: Json | null
          success_sabotage_score?: number | null
          temperament: string
          temperament_scores?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_narrative?: string | null
          avatar_type?: string
          breakthrough_path?: string | null
          collision_blueprint?: string | null
          compass_crisis_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          neural_protocol?: string | null
          past_prison_score?: number | null
          primary_pattern?: string
          sub_pattern_scores?: Json | null
          success_sabotage_score?: number | null
          temperament?: string
          temperament_scores?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_practices: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          data: Json | null
          deleted_at: string | null
          id: string
          is_late: boolean | null
          points_earned: number | null
          practice_date: string
          practice_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          deleted_at?: string | null
          id?: string
          is_late?: boolean | null
          points_earned?: number | null
          practice_date: string
          practice_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          deleted_at?: string | null
          id?: string
          is_late?: boolean | null
          points_earned?: number | null
          practice_date?: string
          practice_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_practices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "daily_practices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gh_model_weeks: {
        Row: {
          active_days_per_week: number | null
          allow_weekend_scheduling: boolean | null
          created_at: string | null
          friday: Json | null
          id: string
          max_tactics_per_day: number | null
          min_rest_days_per_week: number | null
          monday: Json | null
          notify_on_schedule_change: boolean | null
          overflow_handling: string | null
          preferred_pace: string | null
          saturday: Json | null
          sunday: Json | null
          thursday: Json | null
          total_weekly_minutes: number | null
          tuesday: Json | null
          updated_at: string | null
          user_id: string
          wednesday: Json | null
        }
        Insert: {
          active_days_per_week?: number | null
          allow_weekend_scheduling?: boolean | null
          created_at?: string | null
          friday?: Json | null
          id?: string
          max_tactics_per_day?: number | null
          min_rest_days_per_week?: number | null
          monday?: Json | null
          notify_on_schedule_change?: boolean | null
          overflow_handling?: string | null
          preferred_pace?: string | null
          saturday?: Json | null
          sunday?: Json | null
          thursday?: Json | null
          total_weekly_minutes?: number | null
          tuesday?: Json | null
          updated_at?: string | null
          user_id: string
          wednesday?: Json | null
        }
        Update: {
          active_days_per_week?: number | null
          allow_weekend_scheduling?: boolean | null
          created_at?: string | null
          friday?: Json | null
          id?: string
          max_tactics_per_day?: number | null
          min_rest_days_per_week?: number | null
          monday?: Json | null
          notify_on_schedule_change?: boolean | null
          overflow_handling?: string | null
          preferred_pace?: string | null
          saturday?: Json | null
          sunday?: Json | null
          thursday?: Json | null
          total_weekly_minutes?: number | null
          tuesday?: Json | null
          updated_at?: string | null
          user_id?: string
          wednesday?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "gh_model_weeks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gh_model_weeks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gh_nette_conversations: {
        Row: {
          created_at: string | null
          handoff_suggested: boolean | null
          handoff_target: string | null
          id: string
          message: string
          rag_chunks_used: Json | null
          role: string
          user_context_loaded: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          handoff_suggested?: boolean | null
          handoff_target?: string | null
          id?: string
          message: string
          rag_chunks_used?: Json | null
          role: string
          user_context_loaded?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          handoff_suggested?: boolean | null
          handoff_target?: string | null
          id?: string
          message?: string
          rag_chunks_used?: Json | null
          role?: string
          user_context_loaded?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gh_nette_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gh_nette_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gh_nette_referrals: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          nette_response: string
          referral_module: string
          referral_topic: string
          user_action: string | null
          user_id: string
          user_question: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          nette_response: string
          referral_module: string
          referral_topic: string
          user_action?: string | null
          user_id: string
          user_question: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          nette_response?: string
          referral_module?: string
          referral_topic?: string
          user_action?: string | null
          user_id?: string
          user_question?: string
        }
        Relationships: [
          {
            foreignKeyName: "gh_nette_referrals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "gh_nette_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gh_nette_referrals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gh_nette_referrals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gh_overflow_sessions: {
        Row: {
          actual_duration_min: number | null
          completed_tactic_count: number | null
          completed_tactic_ids: string[] | null
          created_at: string | null
          days_accelerated: number | null
          id: string
          new_week_completion_estimate: string | null
          overflow_count: number | null
          overflow_tactic_ids: string[] | null
          scheduled_duration_min: number | null
          scheduled_tactic_count: number | null
          scheduled_tactic_ids: string[] | null
          session_date: string
          session_end_time: string | null
          session_start_time: string | null
          time_saved_min: number | null
          user_id: string
        }
        Insert: {
          actual_duration_min?: number | null
          completed_tactic_count?: number | null
          completed_tactic_ids?: string[] | null
          created_at?: string | null
          days_accelerated?: number | null
          id?: string
          new_week_completion_estimate?: string | null
          overflow_count?: number | null
          overflow_tactic_ids?: string[] | null
          scheduled_duration_min?: number | null
          scheduled_tactic_count?: number | null
          scheduled_tactic_ids?: string[] | null
          session_date: string
          session_end_time?: string | null
          session_start_time?: string | null
          time_saved_min?: number | null
          user_id: string
        }
        Update: {
          actual_duration_min?: number | null
          completed_tactic_count?: number | null
          completed_tactic_ids?: string[] | null
          created_at?: string | null
          days_accelerated?: number | null
          id?: string
          new_week_completion_estimate?: string | null
          overflow_count?: number | null
          overflow_tactic_ids?: string[] | null
          scheduled_duration_min?: number | null
          scheduled_tactic_count?: number | null
          scheduled_tactic_ids?: string[] | null
          session_date?: string
          session_end_time?: string | null
          session_start_time?: string | null
          time_saved_min?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gh_overflow_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gh_overflow_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gh_schedule_changes: {
        Row: {
          change_type: string
          created_at: string | null
          days_shifted: number | null
          id: string
          new_duration: number | null
          new_scheduled_date: string | null
          new_scheduled_time: string | null
          old_duration: number | null
          old_scheduled_date: string | null
          old_scheduled_time: string | null
          reason: string | null
          tactic_id: string | null
          triggered_by: string
          user_id: string
        }
        Insert: {
          change_type: string
          created_at?: string | null
          days_shifted?: number | null
          id?: string
          new_duration?: number | null
          new_scheduled_date?: string | null
          new_scheduled_time?: string | null
          old_duration?: number | null
          old_scheduled_date?: string | null
          old_scheduled_time?: string | null
          reason?: string | null
          tactic_id?: string | null
          triggered_by: string
          user_id: string
        }
        Update: {
          change_type?: string
          created_at?: string | null
          days_shifted?: number | null
          id?: string
          new_duration?: number | null
          new_scheduled_date?: string | null
          new_scheduled_time?: string | null
          old_duration?: number | null
          old_scheduled_date?: string | null
          old_scheduled_time?: string | null
          reason?: string | null
          tactic_id?: string | null
          triggered_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gh_schedule_changes_tactic_id_fkey"
            columns: ["tactic_id"]
            isOneToOne: false
            referencedRelation: "gh_tactic_instructions"
            referencedColumns: ["tactic_id"]
          },
          {
            foreignKeyName: "gh_schedule_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gh_schedule_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gh_scheduled_tactics: {
        Row: {
          actual_duration: number | null
          completed_at: string | null
          created_at: string | null
          energy_level: string | null
          id: string
          journey_day: number | null
          journey_week: number | null
          original_scheduled_date: string | null
          original_scheduled_time: string | null
          reschedule_count: number | null
          reschedule_reason: string | null
          scheduled_date: string
          scheduled_duration: number
          scheduled_time: string
          slot_label: string | null
          slot_type: string | null
          status: string | null
          tactic_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_duration?: number | null
          completed_at?: string | null
          created_at?: string | null
          energy_level?: string | null
          id?: string
          journey_day?: number | null
          journey_week?: number | null
          original_scheduled_date?: string | null
          original_scheduled_time?: string | null
          reschedule_count?: number | null
          reschedule_reason?: string | null
          scheduled_date: string
          scheduled_duration: number
          scheduled_time: string
          slot_label?: string | null
          slot_type?: string | null
          status?: string | null
          tactic_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_duration?: number | null
          completed_at?: string | null
          created_at?: string | null
          energy_level?: string | null
          id?: string
          journey_day?: number | null
          journey_week?: number | null
          original_scheduled_date?: string | null
          original_scheduled_time?: string | null
          reschedule_count?: number | null
          reschedule_reason?: string | null
          scheduled_date?: string
          scheduled_duration?: number
          scheduled_time?: string
          slot_label?: string | null
          slot_type?: string | null
          status?: string | null
          tactic_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gh_scheduled_tactics_tactic_id_fkey"
            columns: ["tactic_id"]
            isOneToOne: false
            referencedRelation: "gh_tactic_instructions"
            referencedColumns: ["tactic_id"]
          },
          {
            foreignKeyName: "gh_scheduled_tactics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gh_scheduled_tactics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gh_state_licensing_info: {
        Row: {
          agency_phone: string | null
          agency_website: string | null
          application_portal: string | null
          available_waivers: Json | null
          average_rate_per_resident_max: number | null
          average_rate_per_resident_min: number | null
          competition_level: string | null
          content_chunk_ids: number[] | null
          created_at: string | null
          id: number
          licensed_model_required_for: Json | null
          licensing_difficulty: string | null
          primary_agency: string | null
          requires_licensing: boolean | null
          state: string
          state_abbr: string
          state_notes: string | null
          time_to_license_max: number | null
          time_to_license_min: number | null
          top_populations: Json | null
          typical_cost_max: number | null
          typical_cost_min: number | null
          unlicensed_model_viable: boolean | null
          updated_at: string | null
        }
        Insert: {
          agency_phone?: string | null
          agency_website?: string | null
          application_portal?: string | null
          available_waivers?: Json | null
          average_rate_per_resident_max?: number | null
          average_rate_per_resident_min?: number | null
          competition_level?: string | null
          content_chunk_ids?: number[] | null
          created_at?: string | null
          id?: number
          licensed_model_required_for?: Json | null
          licensing_difficulty?: string | null
          primary_agency?: string | null
          requires_licensing?: boolean | null
          state: string
          state_abbr: string
          state_notes?: string | null
          time_to_license_max?: number | null
          time_to_license_min?: number | null
          top_populations?: Json | null
          typical_cost_max?: number | null
          typical_cost_min?: number | null
          unlicensed_model_viable?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agency_phone?: string | null
          agency_website?: string | null
          application_portal?: string | null
          available_waivers?: Json | null
          average_rate_per_resident_max?: number | null
          average_rate_per_resident_min?: number | null
          competition_level?: string | null
          content_chunk_ids?: number[] | null
          created_at?: string | null
          id?: number
          licensed_model_required_for?: Json | null
          licensing_difficulty?: string | null
          primary_agency?: string | null
          requires_licensing?: boolean | null
          state?: string
          state_abbr?: string
          state_notes?: string | null
          time_to_license_max?: number | null
          time_to_license_min?: number | null
          top_populations?: Json | null
          typical_cost_max?: number | null
          typical_cost_min?: number | null
          unlicensed_model_viable?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gh_state_success_stories: {
        Row: {
          created_at: string | null
          id: number
          key_challenges: Json | null
          key_lessons: Json | null
          license_status: string | null
          location_city: string | null
          monthly_revenue_per_resident: number | null
          owner_name: string | null
          property_beds: number | null
          property_model: string | null
          source: string | null
          startup_cost: number | null
          state: string
          story_summary: string | null
          target_population: string | null
          time_to_launch_days: number | null
          total_monthly_revenue: number | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          key_challenges?: Json | null
          key_lessons?: Json | null
          license_status?: string | null
          location_city?: string | null
          monthly_revenue_per_resident?: number | null
          owner_name?: string | null
          property_beds?: number | null
          property_model?: string | null
          source?: string | null
          startup_cost?: number | null
          state: string
          story_summary?: string | null
          target_population?: string | null
          time_to_launch_days?: number | null
          total_monthly_revenue?: number | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: number
          key_challenges?: Json | null
          key_lessons?: Json | null
          license_status?: string | null
          location_city?: string | null
          monthly_revenue_per_resident?: number | null
          owner_name?: string | null
          property_beds?: number | null
          property_model?: string | null
          source?: string | null
          startup_cost?: number | null
          state?: string
          story_summary?: string | null
          target_population?: string | null
          time_to_launch_days?: number | null
          total_monthly_revenue?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
      gh_tactic_instructions: {
        Row: {
          best_time_of_day: string[] | null
          can_be_interrupted: boolean | null
          capital_required: string | null
          category: string | null
          common_mistakes: Json | null
          created_at: string | null
          estimated_time: string | null
          experience_level: string | null
          id: string
          instructions: string | null
          lynettes_tip: string | null
          max_duration_minutes: number | null
          min_duration_minutes: number | null
          mood_required: string | null
          optimal_energy: string[] | null
          priority_tier: number | null
          related_tactics: string[] | null
          requires_focus: boolean | null
          requires_tools: Json | null
          resources: Json | null
          step_by_step: Json
          success_criteria: string | null
          tactic_id: string
          tactic_name: string
          tactic_type: string | null
          target_populations: string[] | null
          template_url: string | null
          transcript_reference: Json | null
          week_assignment: number | null
          why_it_matters: string | null
        }
        Insert: {
          best_time_of_day?: string[] | null
          can_be_interrupted?: boolean | null
          capital_required?: string | null
          category?: string | null
          common_mistakes?: Json | null
          created_at?: string | null
          estimated_time?: string | null
          experience_level?: string | null
          id?: string
          instructions?: string | null
          lynettes_tip?: string | null
          max_duration_minutes?: number | null
          min_duration_minutes?: number | null
          mood_required?: string | null
          optimal_energy?: string[] | null
          priority_tier?: number | null
          related_tactics?: string[] | null
          requires_focus?: boolean | null
          requires_tools?: Json | null
          resources?: Json | null
          step_by_step: Json
          success_criteria?: string | null
          tactic_id: string
          tactic_name: string
          tactic_type?: string | null
          target_populations?: string[] | null
          template_url?: string | null
          transcript_reference?: Json | null
          week_assignment?: number | null
          why_it_matters?: string | null
        }
        Update: {
          best_time_of_day?: string[] | null
          can_be_interrupted?: boolean | null
          capital_required?: string | null
          category?: string | null
          common_mistakes?: Json | null
          created_at?: string | null
          estimated_time?: string | null
          experience_level?: string | null
          id?: string
          instructions?: string | null
          lynettes_tip?: string | null
          max_duration_minutes?: number | null
          min_duration_minutes?: number | null
          mood_required?: string | null
          optimal_energy?: string[] | null
          priority_tier?: number | null
          related_tactics?: string[] | null
          requires_focus?: boolean | null
          requires_tools?: Json | null
          resources?: Json | null
          step_by_step?: Json
          success_criteria?: string | null
          tactic_id?: string
          tactic_name?: string
          tactic_type?: string | null
          target_populations?: string[] | null
          template_url?: string | null
          transcript_reference?: Json | null
          week_assignment?: number | null
          why_it_matters?: string | null
        }
        Relationships: []
      }
      gh_training_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          embedding: string
          fts: unknown
          id: string
          related_tactics: string[] | null
          source_file: string
          topic_tags: string[] | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          embedding: string
          fts?: unknown
          id?: string
          related_tactics?: string[] | null
          source_file: string
          topic_tags?: string[] | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          embedding?: string
          fts?: unknown
          id?: string
          related_tactics?: string[] | null
          source_file?: string
          topic_tags?: string[] | null
        }
        Relationships: []
      }
      gh_user_tactic_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          started_at: string | null
          status: string | null
          tactic_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          tactic_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          tactic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gh_user_tactic_progress_tactic_id_fkey"
            columns: ["tactic_id"]
            isOneToOne: false
            referencedRelation: "gh_tactic_instructions"
            referencedColumns: ["tactic_id"]
          },
          {
            foreignKeyName: "gh_user_tactic_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gh_user_tactic_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_collision_assessments: {
        Row: {
          assessment_type: string | null
          breakthrough_triggers: Json | null
          compass_crisis_score: number | null
          completed_at: string | null
          completed_on_day: number | null
          completion_prompt: string | null
          created_at: string | null
          dominant_pattern: string | null
          id: string
          past_prison_score: number | null
          pattern_confidence: number | null
          pattern_description: string | null
          recommended_rewiring_protocol: Json | null
          responses: Json
          sabotage_signatures: Json | null
          session_id: string
          started_at: string | null
          success_sabotage_score: number | null
          time_to_complete_seconds: number | null
          user_id: string | null
        }
        Insert: {
          assessment_type?: string | null
          breakthrough_triggers?: Json | null
          compass_crisis_score?: number | null
          completed_at?: string | null
          completed_on_day?: number | null
          completion_prompt?: string | null
          created_at?: string | null
          dominant_pattern?: string | null
          id?: string
          past_prison_score?: number | null
          pattern_confidence?: number | null
          pattern_description?: string | null
          recommended_rewiring_protocol?: Json | null
          responses: Json
          sabotage_signatures?: Json | null
          session_id: string
          started_at?: string | null
          success_sabotage_score?: number | null
          time_to_complete_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          assessment_type?: string | null
          breakthrough_triggers?: Json | null
          compass_crisis_score?: number | null
          completed_at?: string | null
          completed_on_day?: number | null
          completion_prompt?: string | null
          created_at?: string | null
          dominant_pattern?: string | null
          id?: string
          past_prison_score?: number | null
          pattern_confidence?: number | null
          pattern_description?: string | null
          recommended_rewiring_protocol?: Json | null
          responses?: Json
          sabotage_signatures?: Json | null
          session_id?: string
          started_at?: string | null
          success_sabotage_score?: number | null
          time_to_complete_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_collision_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "identity_collision_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_collision_scores: {
        Row: {
          collision_count: number | null
          collision_type: string
          created_at: string | null
          id: string
          last_collision_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collision_count?: number | null
          collision_type: string
          created_at?: string | null
          id?: string
          last_collision_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collision_count?: number | null
          collision_type?: string
          created_at?: string | null
          id?: string
          last_collision_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_collision_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "identity_collision_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mio_chat_metrics: {
        Row: {
          ai_response: string | null
          cache_age_ms: number | null
          cache_hit: boolean | null
          chat_input: string | null
          conversation_length: number | null
          created_at: string | null
          feedback_quality_score: number | null
          had_practice_context: boolean | null
          id: string
          kb_chunks_used: boolean | null
          practice_type: string | null
          response_time_ms: number | null
          response_timestamp: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          ai_response?: string | null
          cache_age_ms?: number | null
          cache_hit?: boolean | null
          chat_input?: string | null
          conversation_length?: number | null
          created_at?: string | null
          feedback_quality_score?: number | null
          had_practice_context?: boolean | null
          id?: string
          kb_chunks_used?: boolean | null
          practice_type?: string | null
          response_time_ms?: number | null
          response_timestamp?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          ai_response?: string | null
          cache_age_ms?: number | null
          cache_hit?: boolean | null
          chat_input?: string | null
          conversation_length?: number | null
          created_at?: string | null
          feedback_quality_score?: number | null
          had_practice_context?: boolean | null
          id?: string
          kb_chunks_used?: boolean | null
          practice_type?: string | null
          response_time_ms?: number | null
          response_timestamp?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      mio_coach_intelligence: {
        Row: {
          accountability_intervention_needed: boolean | null
          accountability_score: number | null
          accountability_signatures: Json | null
          avg_practice_time: string | null
          avg_recording_duration_seconds: number | null
          behavioral_summary: string
          breakthrough_eta_days: number | null
          breakthrough_probability: number | null
          breakthrough_signals: Json | null
          celebration_count_7d: number | null
          celebration_orientation: string | null
          cohort_comparison_status: string | null
          collision_context_primary: string | null
          collision_pattern: string | null
          contextual_pattern_map: Json | null
          current_day: number
          days_active: number
          dropout_risk_factors: Json | null
          dropout_risk_level: string | null
          dropout_risk_score: number | null
          edit_pattern_type: string | null
          edit_rate: number | null
          energy_avg_30d: number | null
          energy_avg_7d: number | null
          energy_depletion_status: string | null
          energy_trend: string | null
          external_celebration_pct: number | null
          generated_at: string
          growth_edges: Json
          id: string
          identity_behavior_gap_score: number | null
          identity_statement_diagnostic: string | null
          identity_themes: Json | null
          intelligence_version: number | null
          internal_celebration_pct: number | null
          intervention_urgency: string | null
          last_chat_context_update: string | null
          last_gap_date: string | null
          late_night_practice_pct: number | null
          low_quality_reframe_count: number | null
          morning_practice_pct: number | null
          partner_dynamics_status: string | null
          pattern_specialization_primary: string | null
          practice_count_analyzed: number
          practice_time_variance_minutes: number | null
          practice_timing_pattern: string | null
          priority_focus_area: string
          priority_reason: string
          recent_patterns: Json
          recommended_intervention: string | null
          reframe_quality_avg: number | null
          reframe_quality_scores: Json | null
          reframe_quality_trend: string | null
          routine_stability_score: number | null
          routine_stability_trend: string | null
          routine_variance_sd_minutes: number | null
          strengths: Json
          temporal_orientation: Json | null
          temporal_shift_trend: string | null
          three_day_gap_count: number | null
          three_day_gap_detected: boolean | null
          user_id: string
          voice_duration_trend: string | null
        }
        Insert: {
          accountability_intervention_needed?: boolean | null
          accountability_score?: number | null
          accountability_signatures?: Json | null
          avg_practice_time?: string | null
          avg_recording_duration_seconds?: number | null
          behavioral_summary: string
          breakthrough_eta_days?: number | null
          breakthrough_probability?: number | null
          breakthrough_signals?: Json | null
          celebration_count_7d?: number | null
          celebration_orientation?: string | null
          cohort_comparison_status?: string | null
          collision_context_primary?: string | null
          collision_pattern?: string | null
          contextual_pattern_map?: Json | null
          current_day: number
          days_active: number
          dropout_risk_factors?: Json | null
          dropout_risk_level?: string | null
          dropout_risk_score?: number | null
          edit_pattern_type?: string | null
          edit_rate?: number | null
          energy_avg_30d?: number | null
          energy_avg_7d?: number | null
          energy_depletion_status?: string | null
          energy_trend?: string | null
          external_celebration_pct?: number | null
          generated_at?: string
          growth_edges: Json
          id?: string
          identity_behavior_gap_score?: number | null
          identity_statement_diagnostic?: string | null
          identity_themes?: Json | null
          intelligence_version?: number | null
          internal_celebration_pct?: number | null
          intervention_urgency?: string | null
          last_chat_context_update?: string | null
          last_gap_date?: string | null
          late_night_practice_pct?: number | null
          low_quality_reframe_count?: number | null
          morning_practice_pct?: number | null
          partner_dynamics_status?: string | null
          pattern_specialization_primary?: string | null
          practice_count_analyzed: number
          practice_time_variance_minutes?: number | null
          practice_timing_pattern?: string | null
          priority_focus_area: string
          priority_reason: string
          recent_patterns: Json
          recommended_intervention?: string | null
          reframe_quality_avg?: number | null
          reframe_quality_scores?: Json | null
          reframe_quality_trend?: string | null
          routine_stability_score?: number | null
          routine_stability_trend?: string | null
          routine_variance_sd_minutes?: number | null
          strengths: Json
          temporal_orientation?: Json | null
          temporal_shift_trend?: string | null
          three_day_gap_count?: number | null
          three_day_gap_detected?: boolean | null
          user_id: string
          voice_duration_trend?: string | null
        }
        Update: {
          accountability_intervention_needed?: boolean | null
          accountability_score?: number | null
          accountability_signatures?: Json | null
          avg_practice_time?: string | null
          avg_recording_duration_seconds?: number | null
          behavioral_summary?: string
          breakthrough_eta_days?: number | null
          breakthrough_probability?: number | null
          breakthrough_signals?: Json | null
          celebration_count_7d?: number | null
          celebration_orientation?: string | null
          cohort_comparison_status?: string | null
          collision_context_primary?: string | null
          collision_pattern?: string | null
          contextual_pattern_map?: Json | null
          current_day?: number
          days_active?: number
          dropout_risk_factors?: Json | null
          dropout_risk_level?: string | null
          dropout_risk_score?: number | null
          edit_pattern_type?: string | null
          edit_rate?: number | null
          energy_avg_30d?: number | null
          energy_avg_7d?: number | null
          energy_depletion_status?: string | null
          energy_trend?: string | null
          external_celebration_pct?: number | null
          generated_at?: string
          growth_edges?: Json
          id?: string
          identity_behavior_gap_score?: number | null
          identity_statement_diagnostic?: string | null
          identity_themes?: Json | null
          intelligence_version?: number | null
          internal_celebration_pct?: number | null
          intervention_urgency?: string | null
          last_chat_context_update?: string | null
          last_gap_date?: string | null
          late_night_practice_pct?: number | null
          low_quality_reframe_count?: number | null
          morning_practice_pct?: number | null
          partner_dynamics_status?: string | null
          pattern_specialization_primary?: string | null
          practice_count_analyzed?: number
          practice_time_variance_minutes?: number | null
          practice_timing_pattern?: string | null
          priority_focus_area?: string
          priority_reason?: string
          recent_patterns?: Json
          recommended_intervention?: string | null
          reframe_quality_avg?: number | null
          reframe_quality_scores?: Json | null
          reframe_quality_trend?: string | null
          routine_stability_score?: number | null
          routine_stability_trend?: string | null
          routine_variance_sd_minutes?: number | null
          strengths?: Json
          temporal_orientation?: Json | null
          temporal_shift_trend?: string | null
          three_day_gap_count?: number | null
          three_day_gap_detected?: boolean | null
          user_id?: string
          voice_duration_trend?: string | null
        }
        Relationships: []
      }
      mio_conversations: {
        Row: {
          conversation_turns: number | null
          conversation_type: string | null
          created_at: string | null
          current_topic: string | null
          feedback_id: string | null
          id: string
          initiated_by: string | null
          key_insights: string[] | null
          last_message_at: string | null
          messages: Json
          mio_tone_strategy: Json | null
          practice_id: string | null
          practice_type: string | null
          protocols_discussed: string[] | null
          resolved_at: string | null
          sentiment_trend: string | null
          started_at: string | null
          status: string | null
          tone_evolution: Json | null
          total_messages: number | null
          updated_at: string | null
          user_commitments: string[] | null
          user_id: string
          user_tone_detected: Json | null
        }
        Insert: {
          conversation_turns?: number | null
          conversation_type?: string | null
          created_at?: string | null
          current_topic?: string | null
          feedback_id?: string | null
          id?: string
          initiated_by?: string | null
          key_insights?: string[] | null
          last_message_at?: string | null
          messages?: Json
          mio_tone_strategy?: Json | null
          practice_id?: string | null
          practice_type?: string | null
          protocols_discussed?: string[] | null
          resolved_at?: string | null
          sentiment_trend?: string | null
          started_at?: string | null
          status?: string | null
          tone_evolution?: Json | null
          total_messages?: number | null
          updated_at?: string | null
          user_commitments?: string[] | null
          user_id: string
          user_tone_detected?: Json | null
        }
        Update: {
          conversation_turns?: number | null
          conversation_type?: string | null
          created_at?: string | null
          current_topic?: string | null
          feedback_id?: string | null
          id?: string
          initiated_by?: string | null
          key_insights?: string[] | null
          last_message_at?: string | null
          messages?: Json
          mio_tone_strategy?: Json | null
          practice_id?: string | null
          practice_type?: string | null
          protocols_discussed?: string[] | null
          resolved_at?: string | null
          sentiment_trend?: string | null
          started_at?: string | null
          status?: string | null
          tone_evolution?: Json | null
          total_messages?: number | null
          updated_at?: string | null
          user_commitments?: string[] | null
          user_id?: string
          user_tone_detected?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mio_conversations_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "mio_practice_feedback"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mio_conversations_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "daily_practices"
            referencedColumns: ["id"]
          },
        ]
      }
      mio_forensic_analysis: {
        Row: {
          analysis_type: string | null
          capability_number: number | null
          confidence_score: number | null
          created_at: string | null
          detected_at: string | null
          evidence: Json
          first_occurrence: string | null
          id: string
          impact_level: string | null
          intervention_sent: boolean | null
          intervention_sent_at: string | null
          intervention_type: string | null
          occurrence_count: number | null
          pattern_detected: string
          predicted_outcome: string | null
          trigger_context: Json | null
          user_context: Json | null
          user_id: string
          user_responded: boolean | null
          user_response_at: string | null
        }
        Insert: {
          analysis_type?: string | null
          capability_number?: number | null
          confidence_score?: number | null
          created_at?: string | null
          detected_at?: string | null
          evidence: Json
          first_occurrence?: string | null
          id?: string
          impact_level?: string | null
          intervention_sent?: boolean | null
          intervention_sent_at?: string | null
          intervention_type?: string | null
          occurrence_count?: number | null
          pattern_detected: string
          predicted_outcome?: string | null
          trigger_context?: Json | null
          user_context?: Json | null
          user_id: string
          user_responded?: boolean | null
          user_response_at?: string | null
        }
        Update: {
          analysis_type?: string | null
          capability_number?: number | null
          confidence_score?: number | null
          created_at?: string | null
          detected_at?: string | null
          evidence?: Json
          first_occurrence?: string | null
          id?: string
          impact_level?: string | null
          intervention_sent?: boolean | null
          intervention_sent_at?: string | null
          intervention_type?: string | null
          occurrence_count?: number | null
          pattern_detected?: string
          predicted_outcome?: string | null
          trigger_context?: Json | null
          user_context?: Json | null
          user_id?: string
          user_responded?: boolean | null
          user_response_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mio_forensic_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mio_forensic_analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mio_insights: {
        Row: {
          capability_used: string | null
          confidence_score: number | null
          content: string
          created_at: string | null
          delivered_at: string | null
          id: string
          insight_type: string
          pattern_detected: string | null
          read_at: string | null
          response_at: string | null
          title: string
          user_id: string
          user_response: string | null
        }
        Insert: {
          capability_used?: string | null
          confidence_score?: number | null
          content: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          insight_type: string
          pattern_detected?: string | null
          read_at?: string | null
          response_at?: string | null
          title: string
          user_id: string
          user_response?: string | null
        }
        Update: {
          capability_used?: string | null
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          insight_type?: string
          pattern_detected?: string | null
          read_at?: string | null
          response_at?: string | null
          title?: string
          user_id?: string
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mio_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mio_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mio_knowledge_chunks: {
        Row: {
          applicable_contexts: string[] | null
          applicable_patterns: string[] | null
          applicable_practice_types: string[] | null
          capability_numbers: number[] | null
          category: string
          chunk_number: number
          chunk_summary: string | null
          chunk_text: string
          created_at: string | null
          embedding: string | null
          file_number: number
          id: string
          is_active: boolean | null
          priority_level: number | null
          protocol_ids: string[] | null
          source_file: string
          subcategory: string | null
          tokens_approx: number
          updated_at: string | null
          version: string | null
        }
        Insert: {
          applicable_contexts?: string[] | null
          applicable_patterns?: string[] | null
          applicable_practice_types?: string[] | null
          capability_numbers?: number[] | null
          category: string
          chunk_number: number
          chunk_summary?: string | null
          chunk_text: string
          created_at?: string | null
          embedding?: string | null
          file_number: number
          id?: string
          is_active?: boolean | null
          priority_level?: number | null
          protocol_ids?: string[] | null
          source_file: string
          subcategory?: string | null
          tokens_approx: number
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          applicable_contexts?: string[] | null
          applicable_patterns?: string[] | null
          applicable_practice_types?: string[] | null
          capability_numbers?: number[] | null
          category?: string
          chunk_number?: number
          chunk_summary?: string | null
          chunk_text?: string
          created_at?: string | null
          embedding?: string | null
          file_number?: number
          id?: string
          is_active?: boolean | null
          priority_level?: number | null
          protocol_ids?: string[] | null
          source_file?: string
          subcategory?: string | null
          tokens_approx?: number
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      mio_practice_feedback: {
        Row: {
          conversation_turns: number | null
          created_at: string | null
          delivered_at: string | null
          depth_score: number | null
          enriched_practice_data: Json | null
          enrichment_applied: boolean | null
          feedback_reason: string | null
          feedback_text: string
          feedback_type: string
          id: string
          mio_tone_adaptation: Json | null
          opened_at: string | null
          pattern_consistency_score: number | null
          practice_id: string | null
          practice_type: string | null
          response_at: string | null
          response_time_seconds: number | null
          sent_at: string | null
          updated_at: string | null
          user_engagement_score: number | null
          user_id: string
          user_response: string | null
          user_tone_profile: Json | null
          vagueness_score: number | null
        }
        Insert: {
          conversation_turns?: number | null
          created_at?: string | null
          delivered_at?: string | null
          depth_score?: number | null
          enriched_practice_data?: Json | null
          enrichment_applied?: boolean | null
          feedback_reason?: string | null
          feedback_text: string
          feedback_type: string
          id?: string
          mio_tone_adaptation?: Json | null
          opened_at?: string | null
          pattern_consistency_score?: number | null
          practice_id?: string | null
          practice_type?: string | null
          response_at?: string | null
          response_time_seconds?: number | null
          sent_at?: string | null
          updated_at?: string | null
          user_engagement_score?: number | null
          user_id: string
          user_response?: string | null
          user_tone_profile?: Json | null
          vagueness_score?: number | null
        }
        Update: {
          conversation_turns?: number | null
          created_at?: string | null
          delivered_at?: string | null
          depth_score?: number | null
          enriched_practice_data?: Json | null
          enrichment_applied?: boolean | null
          feedback_reason?: string | null
          feedback_text?: string
          feedback_type?: string
          id?: string
          mio_tone_adaptation?: Json | null
          opened_at?: string | null
          pattern_consistency_score?: number | null
          practice_id?: string | null
          practice_type?: string | null
          response_at?: string | null
          response_time_seconds?: number | null
          sent_at?: string | null
          updated_at?: string | null
          user_engagement_score?: number | null
          user_id?: string
          user_response?: string | null
          user_tone_profile?: Json | null
          vagueness_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mio_practice_feedback_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "daily_practices"
            referencedColumns: ["id"]
          },
        ]
      }
      mio_user_insights: {
        Row: {
          assessment_vs_actual_match: boolean | null
          body: string
          breakthrough_question: string | null
          challenge_day: number
          challenge_start_date: string | null
          created_at: string | null
          days_active: number
          delivery_method: string | null
          dominant_pattern: string | null
          email_sent: boolean | null
          generated_at: string | null
          id: string
          opened_at: string | null
          pattern_accuracy_pct: number | null
          practices_analyzed: number
          priority_focus_area: string | null
          priority_focus_reasoning: string | null
          priority_focus_score: number | null
          push_notification_sent: boolean | null
          read_duration_seconds: number | null
          report_type: string | null
          report_week: number
          sent_at: string | null
          seven_day_protocol: Json
          title: string
          top_5_insights: Json
          updated_at: string | null
          user_feedback: string | null
          user_id: string
          user_rating: number | null
        }
        Insert: {
          assessment_vs_actual_match?: boolean | null
          body: string
          breakthrough_question?: string | null
          challenge_day: number
          challenge_start_date?: string | null
          created_at?: string | null
          days_active?: number
          delivery_method?: string | null
          dominant_pattern?: string | null
          email_sent?: boolean | null
          generated_at?: string | null
          id?: string
          opened_at?: string | null
          pattern_accuracy_pct?: number | null
          practices_analyzed?: number
          priority_focus_area?: string | null
          priority_focus_reasoning?: string | null
          priority_focus_score?: number | null
          push_notification_sent?: boolean | null
          read_duration_seconds?: number | null
          report_type?: string | null
          report_week: number
          sent_at?: string | null
          seven_day_protocol?: Json
          title: string
          top_5_insights?: Json
          updated_at?: string | null
          user_feedback?: string | null
          user_id: string
          user_rating?: number | null
        }
        Update: {
          assessment_vs_actual_match?: boolean | null
          body?: string
          breakthrough_question?: string | null
          challenge_day?: number
          challenge_start_date?: string | null
          created_at?: string | null
          days_active?: number
          delivery_method?: string | null
          dominant_pattern?: string | null
          email_sent?: boolean | null
          generated_at?: string | null
          id?: string
          opened_at?: string | null
          pattern_accuracy_pct?: number | null
          practices_analyzed?: number
          priority_focus_area?: string | null
          priority_focus_reasoning?: string | null
          priority_focus_score?: number | null
          push_notification_sent?: boolean | null
          read_duration_seconds?: number | null
          report_type?: string | null
          report_week?: number
          sent_at?: string | null
          seven_day_protocol?: Json
          title?: string
          top_5_insights?: Json
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string
          user_rating?: number | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          achievements: boolean | null
          created_at: string | null
          daily_reminders: boolean | null
          id: string
          partner_messages: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          time_window_alerts: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          achievements?: boolean | null
          created_at?: string | null
          daily_reminders?: boolean | null
          id?: string
          partner_messages?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          time_window_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          achievements?: boolean | null
          created_at?: string | null
          daily_reminders?: boolean | null
          id?: string
          partner_messages?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          time_window_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read_at: string | null
          sent_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_groups: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          group_name: string | null
          group_type: string | null
          id: string
          match_score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          group_name?: string | null
          group_type?: string | null
          id?: string
          match_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          group_name?: string | null
          group_type?: string | null
          id?: string
          match_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_matching_questionnaire: {
        Row: {
          accountability_style: string | null
          biggest_challenge: string | null
          collision_pattern: string | null
          commitment_level: number | null
          communication_frequency: string | null
          completion_rate: string | null
          created_at: string | null
          deleted_at: string | null
          gender_preference: string | null
          id: string
          industry: string | null
          resilience_strategy: string | null
          revenue_range: string | null
          team_size: string | null
          timezone: string | null
          transformation_gap: string | null
          transformation_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accountability_style?: string | null
          biggest_challenge?: string | null
          collision_pattern?: string | null
          commitment_level?: number | null
          communication_frequency?: string | null
          completion_rate?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gender_preference?: string | null
          id?: string
          industry?: string | null
          resilience_strategy?: string | null
          revenue_range?: string | null
          team_size?: string | null
          timezone?: string | null
          transformation_gap?: string | null
          transformation_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accountability_style?: string | null
          biggest_challenge?: string | null
          collision_pattern?: string | null
          commitment_level?: number | null
          communication_frequency?: string | null
          completion_rate?: string | null
          created_at?: string | null
          deleted_at?: string | null
          gender_preference?: string | null
          id?: string
          industry?: string | null
          resilience_strategy?: string | null
          revenue_range?: string | null
          team_size?: string | null
          timezone?: string | null
          transformation_gap?: string | null
          transformation_reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_matching_questionnaire_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_matching_questionnaire_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string | null
          left_at: string | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "partner_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_requests: {
        Row: {
          created_at: string | null
          id: string
          match_score: number
          message: string | null
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_score: number
          message?: string | null
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_score?: number
          message?: string | null
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_practice_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_practice_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_practice_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "practice_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          assessment_completed_at: string | null
          capital_available: string | null
          caregiving_experience: string | null
          commitment_level: number | null
          created_at: string | null
          creative_financing_knowledge: string | null
          credit_score_range: string | null
          financial_score: number | null
          id: string
          income_stability: string | null
          licensing_familiarity: string | null
          market_demand_research: string | null
          market_score: number | null
          mindset_score: number | null
          operational_score: number | null
          overall_score: number | null
          primary_motivation: string | null
          property_management_comfort: string | null
          readiness_level: string | null
          revenue_understanding: string | null
          support_team: string | null
          target_populations: string[] | null
          time_commitment: string | null
          timeline: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_completed_at?: string | null
          capital_available?: string | null
          caregiving_experience?: string | null
          commitment_level?: number | null
          created_at?: string | null
          creative_financing_knowledge?: string | null
          credit_score_range?: string | null
          financial_score?: number | null
          id?: string
          income_stability?: string | null
          licensing_familiarity?: string | null
          market_demand_research?: string | null
          market_score?: number | null
          mindset_score?: number | null
          operational_score?: number | null
          overall_score?: number | null
          primary_motivation?: string | null
          property_management_comfort?: string | null
          readiness_level?: string | null
          revenue_understanding?: string | null
          support_team?: string | null
          target_populations?: string[] | null
          time_commitment?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_completed_at?: string | null
          capital_available?: string | null
          caregiving_experience?: string | null
          commitment_level?: number | null
          created_at?: string | null
          creative_financing_knowledge?: string | null
          credit_score_range?: string | null
          financial_score?: number | null
          id?: string
          income_stability?: string | null
          licensing_familiarity?: string | null
          market_demand_research?: string | null
          market_score?: number | null
          mindset_score?: number | null
          operational_score?: number | null
          overall_score?: number | null
          primary_motivation?: string | null
          property_management_comfort?: string | null
          readiness_level?: string | null
          revenue_understanding?: string | null
          support_team?: string | null
          target_populations?: string[] | null
          time_commitment?: string | null
          timeline?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          assessment_completed_at: string | null
          avatar_type: string | null
          challenge_start_date: string
          championship_level: string | null
          collision_patterns: Json | null
          created_at: string | null
          credit_score_range: string | null
          current_day: number | null
          current_journey_day: number | null
          current_journey_week: number | null
          current_tactic_id: string | null
          daily_streak_count: number | null
          deleted_at: string | null
          email: string
          estimated_completion_date: string | null
          expo_push_token: string | null
          full_name: string | null
          id: string
          include_credit_repair: boolean | null
          last_tactic_completed_at: string | null
          license_status: string | null
          longest_streak: number | null
          ninety_day_vision: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_day_1_complete: boolean | null
          onboarding_day_2_complete: boolean | null
          onboarding_day_3_complete: boolean | null
          onboarding_status: string | null
          property_acquisition_type: string | null
          property_beds: string | null
          push_token: string | null
          real_estate_experience: string | null
          startup_capital: string | null
          target_city: string | null
          target_demographics: Json | null
          target_state: string | null
          temperament: string | null
          timeline_days: number | null
          timezone: string | null
          total_points: number | null
          updated_at: string | null
          week_1_completed_at: string | null
          week_10_completed_at: string | null
          week_11_completed_at: string | null
          week_12_completed_at: string | null
          week_2_completed_at: string | null
          week_3_completed_at: string | null
          week_4_completed_at: string | null
          week_5_completed_at: string | null
          week_6_completed_at: string | null
          week_7_completed_at: string | null
          week_8_completed_at: string | null
          week_9_completed_at: string | null
        }
        Insert: {
          assessment_completed_at?: string | null
          avatar_type?: string | null
          challenge_start_date: string
          championship_level?: string | null
          collision_patterns?: Json | null
          created_at?: string | null
          credit_score_range?: string | null
          current_day?: number | null
          current_journey_day?: number | null
          current_journey_week?: number | null
          current_tactic_id?: string | null
          daily_streak_count?: number | null
          deleted_at?: string | null
          email: string
          estimated_completion_date?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id: string
          include_credit_repair?: boolean | null
          last_tactic_completed_at?: string | null
          license_status?: string | null
          longest_streak?: number | null
          ninety_day_vision?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_day_1_complete?: boolean | null
          onboarding_day_2_complete?: boolean | null
          onboarding_day_3_complete?: boolean | null
          onboarding_status?: string | null
          property_acquisition_type?: string | null
          property_beds?: string | null
          push_token?: string | null
          real_estate_experience?: string | null
          startup_capital?: string | null
          target_city?: string | null
          target_demographics?: Json | null
          target_state?: string | null
          temperament?: string | null
          timeline_days?: number | null
          timezone?: string | null
          total_points?: number | null
          updated_at?: string | null
          week_1_completed_at?: string | null
          week_10_completed_at?: string | null
          week_11_completed_at?: string | null
          week_12_completed_at?: string | null
          week_2_completed_at?: string | null
          week_3_completed_at?: string | null
          week_4_completed_at?: string | null
          week_5_completed_at?: string | null
          week_6_completed_at?: string | null
          week_7_completed_at?: string | null
          week_8_completed_at?: string | null
          week_9_completed_at?: string | null
        }
        Update: {
          assessment_completed_at?: string | null
          avatar_type?: string | null
          challenge_start_date?: string
          championship_level?: string | null
          collision_patterns?: Json | null
          created_at?: string | null
          credit_score_range?: string | null
          current_day?: number | null
          current_journey_day?: number | null
          current_journey_week?: number | null
          current_tactic_id?: string | null
          daily_streak_count?: number | null
          deleted_at?: string | null
          email?: string
          estimated_completion_date?: string | null
          expo_push_token?: string | null
          full_name?: string | null
          id?: string
          include_credit_repair?: boolean | null
          last_tactic_completed_at?: string | null
          license_status?: string | null
          longest_streak?: number | null
          ninety_day_vision?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_day_1_complete?: boolean | null
          onboarding_day_2_complete?: boolean | null
          onboarding_day_3_complete?: boolean | null
          onboarding_status?: string | null
          property_acquisition_type?: string | null
          property_beds?: string | null
          push_token?: string | null
          real_estate_experience?: string | null
          startup_capital?: string | null
          target_city?: string | null
          target_demographics?: Json | null
          target_state?: string | null
          temperament?: string | null
          timeline_days?: number | null
          timezone?: string | null
          total_points?: number | null
          updated_at?: string | null
          week_1_completed_at?: string | null
          week_10_completed_at?: string | null
          week_11_completed_at?: string | null
          week_12_completed_at?: string | null
          week_2_completed_at?: string | null
          week_3_completed_at?: string | null
          week_4_completed_at?: string | null
          week_5_completed_at?: string | null
          week_6_completed_at?: string | null
          week_7_completed_at?: string | null
          week_8_completed_at?: string | null
          week_9_completed_at?: string | null
        }
        Relationships: []
      }
      voice_recordings: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          recording_duration: number
          recording_type: string
          recording_url: string
          transcription_status: string | null
          transcription_text: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          recording_duration: number
          recording_type: string
          recording_url: string
          transcription_status?: string | null
          transcription_text?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          recording_duration?: number
          recording_type?: string
          recording_url?: string
          transcription_status?: string | null
          transcription_text?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "voice_recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_assessment_scores: {
        Row: {
          assessment_date: string
          assessment_day: number
          assessment_week: number
          collision_specific_responses: Json | null
          collision_specific_score: number | null
          created_at: string | null
          id: string
          improvement_trend: string | null
          overall_weekly_score: number | null
          q1_identity_clarity: number | null
          q2_pattern_awareness: number | null
          q3_response_choice: number | null
          q4_energy_management: number | null
          q5_evidence_collection: number | null
          score_change_from_week1: number | null
          universal_avg_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assessment_date?: string
          assessment_day: number
          assessment_week: number
          collision_specific_responses?: Json | null
          collision_specific_score?: number | null
          created_at?: string | null
          id?: string
          improvement_trend?: string | null
          overall_weekly_score?: number | null
          q1_identity_clarity?: number | null
          q2_pattern_awareness?: number | null
          q3_response_choice?: number | null
          q4_energy_management?: number | null
          q5_evidence_collection?: number | null
          score_change_from_week1?: number | null
          universal_avg_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assessment_date?: string
          assessment_day?: number
          assessment_week?: number
          collision_specific_responses?: Json | null
          collision_specific_score?: number | null
          created_at?: string | null
          id?: string
          improvement_trend?: string | null
          overall_weekly_score?: number | null
          q1_identity_clarity?: number | null
          q2_pattern_awareness?: number | null
          q3_response_choice?: number | null
          q4_energy_management?: number | null
          q5_evidence_collection?: number | null
          score_change_from_week1?: number | null
          universal_avg_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_insights: {
        Row: {
          ai_generated_content: Json | null
          created_at: string | null
          focus_area: string | null
          id: string
          identity_shift_score: number | null
          key_insight: string | null
          transformation_velocity: number | null
          user_id: string
          week_number: number
        }
        Insert: {
          ai_generated_content?: Json | null
          created_at?: string | null
          focus_area?: string | null
          id?: string
          identity_shift_score?: number | null
          key_insight?: string | null
          transformation_velocity?: number | null
          user_id: string
          week_number: number
        }
        Update: {
          ai_generated_content?: Json | null
          created_at?: string | null
          focus_area?: string | null
          id?: string
          identity_shift_score?: number | null
          key_insight?: string | null
          transformation_velocity?: number | null
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "weekly_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      avatar_assessment_stats: {
        Row: {
          completed_assessments: number | null
          completed_last_30_days: number | null
          completed_last_7_days: number | null
          completion_rate: number | null
          total_users: number | null
        }
        Relationships: []
      }
      avatar_distribution: {
        Row: {
          avatar_type: string | null
          percentage: number | null
          primary_pattern: string | null
          temperament: string | null
          user_count: number | null
        }
        Relationships: []
      }
      gh_todays_schedule: {
        Row: {
          energy_level: string | null
          estimated_time: string | null
          scheduled_duration: number | null
          scheduled_time: string | null
          slot_label: string | null
          status: string | null
          tactic_id: string | null
          tactic_name: string | null
          tactic_type: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gh_scheduled_tactics_tactic_id_fkey"
            columns: ["tactic_id"]
            isOneToOne: false
            referencedRelation: "gh_tactic_instructions"
            referencedColumns: ["tactic_id"]
          },
          {
            foreignKeyName: "gh_scheduled_tactics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "gh_user_schedule_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "gh_scheduled_tactics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gh_user_schedule_summary: {
        Row: {
          active_days_per_week: number | null
          completed_tactics: number | null
          current_journey_week: number | null
          daily_streak_count: number | null
          estimated_completion_date: string | null
          full_name: string | null
          preferred_pace: string | null
          skipped_tactics: number | null
          total_weekly_minutes: number | null
          upcoming_tactics: number | null
          user_id: string | null
        }
        Relationships: []
      }
      mio_chat_by_practice_type: {
        Row: {
          avg_quality_score: number | null
          kb_usage_count: number | null
          practice_type: string | null
          total_chats: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      mio_chat_daily_stats: {
        Row: {
          avg_conversation_length: number | null
          avg_response_time_ms: number | null
          date: string | null
          kb_searches: number | null
          total_chats: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      mio_chat_high_quality_recent: {
        Row: {
          chat_input: string | null
          conversation_length: number | null
          feedback_quality_score: number | null
          practice_type: string | null
          response_preview: string | null
          response_timestamp: string | null
          user_name: string | null
        }
        Relationships: []
      }
      mio_insight_performance: {
        Row: {
          avg_practices_per_report: number | null
          avg_read_time_seconds: number | null
          avg_user_rating: number | null
          focus_area_frequency: number | null
          insights_opened: number | null
          open_rate_pct: number | null
          priority_focus_area: string | null
          report_week: number | null
          users_generated: number | null
        }
        Relationships: []
      }
      mio_tone_effectiveness: {
        Row: {
          avg_engagement: number | null
          feedback_instances: number | null
          mio_directness: number | null
          mio_warmth: number | null
          open_rate_pct: number | null
          opened: number | null
          responded: number | null
          response_rate_pct: number | null
          user_directness: number | null
          user_warmth: number | null
        }
        Relationships: []
      }
      weekly_progress_dashboard: {
        Row: {
          assessment_date: string | null
          assessment_day: number | null
          assessment_id: string | null
          assessment_week: number | null
          collision_specific_responses: Json | null
          collision_specific_score: number | null
          collision_type: string | null
          created_at: string | null
          days_practiced_this_week: number | null
          email: string | null
          final_weighted_score: number | null
          full_name: string | null
          improvement_trend: string | null
          overall_weekly_score: number | null
          q1_identity_clarity: number | null
          q2_pattern_awareness: number | null
          q3_response_choice: number | null
          q4_energy_management: number | null
          q5_evidence_collection: number | null
          score_change_from_week1: number | null
          universal_avg_score: number | null
          updated_at: string | null
          user_id: string | null
          week_consistency_percent: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_momentum_metrics: { Args: { p_user_id: string }; Returns: Json }
      get_assessment_progress: {
        Args: { p_user_id: string }
        Returns: {
          is_completed: boolean
          pattern_answers: number
          sub_pattern_answers: number
          temperament_answers: number
          total_answers: number
        }[]
      }
      get_practice_with_context: {
        Args: { p_practice_id: string; p_user_id: string }
        Returns: Json
      }
      get_state_intelligence: {
        Args: { p_state: string; p_target_population?: string }
        Returns: Json
      }
      get_today_focus: { Args: { p_user_id: string }; Returns: Json }
      get_user_avatar_assessment: {
        Args: { p_user_id: string }
        Returns: {
          avatar_narrative: string
          avatar_type: string
          breakthrough_path: string
          collision_blueprint: string
          compass_crisis_score: number
          completed_at: string
          neural_protocol: string
          past_prison_score: number
          primary_pattern: string
          sub_pattern_scores: Json
          success_sabotage_score: number
          temperament: string
          temperament_scores: Json
          total_answers: number
        }[]
      }
      get_user_journey_position: { Args: { p_user_id: string }; Returns: Json }
      gh_get_mio_behavioral_data: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: Json
      }
      gh_get_recommended_tactics: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          category: string
          estimated_time: string
          reason: string
          tactic_id: string
          tactic_name: string
          week_assignment: number
          why_it_matters: string
        }[]
      }
      gh_get_tactic_completion_rates: {
        Args: never
        Returns: {
          avg_days_to_complete: number
          completion_rate: number
          tactic_id: string
          tactic_name: string
          total_completed: number
          total_started: number
          week_assignment: number
        }[]
      }
      gh_get_user_context: { Args: { p_user_id: string }; Returns: Json }
      gh_get_user_progress_stats: { Args: { p_user_id: string }; Returns: Json }
      gh_hybrid_search: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
          rrf_k?: number
        }
        Returns: {
          chunk_text: string
          id: string
          rank: number
          related_tactics: string[]
          similarity: number
          source_file: string
          topic_tags: string[]
        }[]
      }
      gh_search_tactics: {
        Args: { p_limit?: number; p_search_term: string }
        Returns: {
          category: string
          estimated_time: string
          tactic_id: string
          tactic_name: string
          week_assignment: number
          why_it_matters: string
        }[]
      }
      has_completed_identity_collision: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      hybrid_search_with_state: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
          user_state: string
        }
        Returns: {
          chunk_id: number
          chunk_text: string
          is_state_specific: boolean
          similarity_score: number
          source_file: string
          topic_tags: string[]
        }[]
      }
      match_knowledge_chunks: {
        Args: {
          filter?: Json
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      soft_delete_user_account: {
        Args: { target_user_id: string }
        Returns: undefined
      }
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
