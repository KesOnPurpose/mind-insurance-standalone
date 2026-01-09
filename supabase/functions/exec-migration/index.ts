import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify service role key by decoding JWT payload
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT and decode payload to check role
    const token = authHeader.replace('Bearer ', '');
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'service_role') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - service role required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the direct Postgres URL from environment
    const SUPABASE_DB_URL = Deno.env.get('SUPABASE_DB_URL');
    if (!SUPABASE_DB_URL) {
      throw new Error('Database URL not configured');
    }

    const { sql } = await req.json();
    if (!sql) {
      return new Response(
        JSON.stringify({ error: 'SQL parameter required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use raw Postgres client via Deno
    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');

    const client = new Client(SUPABASE_DB_URL);
    await client.connect();

    const result = await client.queryArray(sql);
    await client.end();

    return new Response(
      JSON.stringify({ success: true, result: result.rows }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
