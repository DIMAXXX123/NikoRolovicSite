import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { token, endpoint } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: 'No token provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allowed = ['getuser', 'marks', 'attendance', 'conduct', 'discipline', 'exttest'];
    if (!allowed.includes(endpoint)) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch(`https://www.dnevnik.edu.me/api/${endpoint}`, {
      headers: {
        'x-access-token': token,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Origin': 'https://www.dnevnik.edu.me',
        'Referer': 'https://www.dnevnik.edu.me/main',
        'Accept': 'application/json, text/plain, */*',
      },
    });

    const data = await resp.text();
    
    // Check if response is HTML error (not JSON)
    if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
      // Extract error message from HTML if possible
      const match = data.match(/<pre>(.*?)<\/pre>/s);
      const errorMsg = match ? match[1].replace(/<br>/g, ' ').replace(/&nbsp;/g, ' ').substring(0, 200) : 'eDnevnik server error';
      
      // Check if it's an auth error
      if (data.includes('UnauthorizedError') || data.includes('No authorization token')) {
        return new Response(JSON.stringify({ error: 'Token istekao. Prijavite se ponovo.', code: 'TOKEN_EXPIRED' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Check if WAF blocked
      if (data.includes('Request Rejected')) {
        return new Response(JSON.stringify({ error: 'eDnevnik je privremeno nedostupan.' }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(data, {
      status: resp.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
