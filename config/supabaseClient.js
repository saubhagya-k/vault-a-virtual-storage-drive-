// config/supabaseClient.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// For general server operations you can use the ANON key.
// For admin-only operations (create users, bypass RLS) use the SERVICE_ROLE key.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;