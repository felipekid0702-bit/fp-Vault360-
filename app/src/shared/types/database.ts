export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: any
    Views: any
    Functions: any
    Enums: any
    CompositeTypes: any
  }
}
