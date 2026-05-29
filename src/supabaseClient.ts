import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sagcmetvrxwdfwkhyoml.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZ2NtZXR2cnh3ZGZ3a2h5b21sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMjA2MjcsImV4cCI6MjA5MzU5NjYyN30.Lsbf-JuMgTr0s5JaZD07_YlJSPditvkIlsMsYlysrL4'

export const supabase = createClient(supabaseUrl, supabaseKey)