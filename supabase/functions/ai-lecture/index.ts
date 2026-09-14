// supabase/functions/ai-lecture/index.ts
// Edge Function: processes lecture images via OpenAI Vision API server-side.
// The OpenAI key NEVER leaves the server.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Parse request body (auth handled by app-side session check)
    const { images, subject, customPrompt, mode, lectureText, targetLanguage } = await req.json();

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt: string;
    let userContent: any;

    if (mode === 'improve') {
      // Improve existing lecture
      if (!lectureText) {
        return new Response(JSON.stringify({ error: 'No lecture text provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      systemPrompt = 'You are improving an existing lecture for a Montenegrin school app (Gimnazija Niko Rolović). Keep everything in MONTENEGRIN language (crnogorski/srpski latinica). Apply the user\'s instructions to improve the lecture. Return the same JSON format:\n{\n  "title": "Naslov lekcije",\n  "type": "lecture" | "assignment" | "mixed",\n  "sections": [{"heading": "Naslov", "content": "Detaljan sadržaj..."}],\n  "quiz": [{"question": "Pitanje?", "options": ["A","B","C","D"], "correct": 0-3}],\n  "flashcards": [{"front": "Pojam", "back": "Definicija"}],\n  "keyTerms": [{"term": "Termin", "definition": "Objašnjenje"}],\n  "summary": "Kratki rezime lekcije"\n}\n\nFor mathematical formulas, use Unicode notation:\n- Superscripts: ⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ (x² not x^2)\n- Subscripts: ₀₁₂₃₄₅₆₇₈₉ₐₑₒₓ (log₂ not log_2)\n- Fractions: (brojilac)/(imenilac)\n- Symbols: √ ∞ ∫ ± ≤ ≥ ≠ ≈ α β γ δ ε θ λ μ π σ φ ω Σ Π Δ Ω';
      userContent = [{ type: 'text' as const, text: `Current lecture:\n${lectureText}\n\nInstructions: ${customPrompt || 'Improve and expand the lecture'}` }];
    } else if (mode === 'translate') {
      // Translate existing lecture
      if (!lectureText) {
        return new Response(JSON.stringify({ error: 'No lecture text provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const lang = targetLanguage || 'Russian';
      systemPrompt = `Translate the following lecture to ${lang}. Keep all formatting, formulas, and structure. Return the same JSON format but in ${lang}:\n{\n  "title": "string",\n  "type": "lecture" | "assignment" | "mixed",\n  "sections": [{"heading": "string", "content": "string"}],\n  "quiz": [{"question": "string", "options": ["4 options"], "correct": 0-3}],\n  "flashcards": [{"front": "string", "back": "string"}],\n  "keyTerms": [{"term": "string", "definition": "string"}],\n  "summary": "string"\n}`;
      userContent = [{ type: 'text' as const, text: `Lecture to translate:\n${lectureText}` }];
    } else {
      // Default: generate from images
      if (!images || !Array.isArray(images) || images.length === 0) {
        return new Response(JSON.stringify({ error: 'No images provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (images.length > 10) {
        return new Response(JSON.stringify({ error: 'Maximum 10 images allowed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build OpenAI Vision request — detect image format from base64 header bytes
      const imageContent = images.map((b64: string) => {
        let mime = 'image/jpeg'; // default
        if (b64.startsWith('iVBOR')) mime = 'image/png';
        else if (b64.startsWith('R0lGO')) mime = 'image/gif';
        else if (b64.startsWith('UklGR')) mime = 'image/webp';
        return {
          type: 'image_url' as const,
          image_url: { url: `data:${mime};base64,${b64}` },
        };
      });

      systemPrompt = `You are an intelligent lecture structuring AI for a Montenegrin school app (Gimnazija Niko Rolović).

CRITICAL RULES:
1. ALL output MUST be in MONTENEGRIN language (crnogorski/srpski latinica). No exceptions.
2. DO NOT add information that is not in the provided photos. Only structure and format what you see.
3. Be as DETAILED and THOROUGH as possible — extract ALL text, formulas, diagrams from images.
4. Make the lecture as LONG as possible with maximum detail from the source material.
5. For mathematical formulas, use Unicode notation:
   - Superscripts: ⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ (x² not x^2)
   - Subscripts: ₀₁₂₃₄₅₆₇₈₉ₐₑₒₓ (log₂ not log_2)
   - Fractions: (brojilac)/(imenilac)
   - Symbols: √ ∞ ∫ ± ≤ ≥ ≠ ≈ α β γ δ ε θ λ μ π σ φ ω Σ Π Δ Ω
6. If photos contain diagrams, describe them as [SLIKA: opis dijagrama]

OUTPUT FORMAT (JSON):
{
  "title": "Naslov lekcije",
  "type": "lecture" | "assignment" | "mixed",
  "sections": [{"heading": "Naslov", "content": "Detaljan sadržaj..."}],
  "quiz": [{"question": "Pitanje?", "options": ["A","B","C","D"], "correct": 0-3}],
  "flashcards": [{"front": "Pojam", "back": "Definicija"}],
  "keyTerms": [{"term": "Termin", "definition": "Objašnjenje"}],
  "summary": "Kratki rezime lekcije"
}

REQUIREMENTS:
- At least 5 detailed sections
- At least 6 quiz questions with 4 options each
- At least 6 flashcards
- At least 5 key terms
- Detailed summary paragraph`;

      let userText = `Structure these lecture materials for subject "${subject || 'General'}" into a comprehensive lecture with quiz and flashcards`;
      if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
        userText += `\n\nAdditional instructions from user: ${customPrompt.trim()}`;
      }

      userContent = [
        { type: 'text' as const, text: userText },
        ...imageContent,
      ];
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 8192,
        response_format: { type: 'json_object' },
      }),
    });

    const openaiData = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI error:', JSON.stringify(openaiData));
      const detail = openaiData?.error?.message || 'Unknown OpenAI error';
      return new Response(JSON.stringify({ error: `AI error: ${detail}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: 'Empty AI response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Parse and validate the response
    const lecture = JSON.parse(content);

    if (!lecture.title || !lecture.sections || !lecture.quiz) {
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Return structured lecture
    return new Response(JSON.stringify(lecture), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Edge function error:', message);
    return new Response(JSON.stringify({ error: `Server error: ${message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
