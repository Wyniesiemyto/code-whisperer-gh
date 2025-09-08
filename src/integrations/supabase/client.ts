import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://lxsvcnisnifhnxspsxdm.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4c3ZjbmlzbmlmaG54c3BzeGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4MDI5NzQsImV4cCI6MjA0MTM3ODk3NH0.Iot-NeuGcGIjA9HdNFfGdNAbKbmi-xXnN0CqAlRPRMs"

export const supabase = createClient(supabaseUrl, supabaseKey)