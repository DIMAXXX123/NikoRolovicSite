import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

serve(async (req) => {
  try {
    const body = await req.json();

    if (body.callback_query) {
      const cb = body.callback_query;
      const data = cb.data || '';
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      let responseText = '❓ Nepoznata akcija';

      if (data.startsWith('approve_')) {
        const photoId = data.replace('approve_', '');
        const { error } = await supabase.from('photos').update({ status: 'approved' }).eq('id', photoId);
        responseText = error ? `❌ Greška: ${error.message}` : '✅ Fotografija odobrena!';
      } else if (data.startsWith('reject_')) {
        const photoId = data.replace('reject_', '');
        // Delete from storage too
        const { data: photo } = await supabase.from('photos').select('image_url').eq('id', photoId).single();
        if (photo?.image_url) {
          const path = photo.image_url.split('/photos/')[1];
          if (path) await supabase.storage.from('photos').remove([decodeURIComponent(path)]);
        }
        await supabase.from('photos').delete().eq('id', photoId);
        responseText = '❌ Fotografija odbijena i obrisana.';
      } else if (data.startsWith('delete_')) {
        const photoId = data.replace('delete_', '');
        const { data: photo } = await supabase.from('photos').select('image_url').eq('id', photoId).single();
        if (photo?.image_url) {
          const path = photo.image_url.split('/photos/')[1];
          if (path) await supabase.storage.from('photos').remove([decodeURIComponent(path)]);
        }
        await supabase.from('photos').delete().eq('id', photoId);
        // Also delete reports for this photo
        await supabase.from('photo_reports').delete().eq('photo_id', photoId);
        responseText = '🗑 Fotografija obrisana.';
      } else if (data.startsWith('keep_')) {
        // Dismiss report, keep photo
        const photoId = data.replace('keep_', '');
        await supabase.from('photo_reports').delete().eq('photo_id', photoId);
        responseText = '✅ Prijava odbačena, fotografija ostaje.';
      }

      // Answer callback query (removes loading spinner on button)
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id, text: responseText }),
      });

      // Edit original message to show result (remove buttons)
      if (chatId && messageId) {
        const origCaption = cb.message?.caption || '';
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            caption: origCaption + '\n\n' + responseText,
          }),
        });
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err: unknown) {
    console.error('Webhook error:', err);
    return new Response('ok', { status: 200 }); // Always return 200 to Telegram
  }
});
