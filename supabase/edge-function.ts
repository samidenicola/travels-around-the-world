// ============================================================
// Edge Function: "admin"
// Deploy via Supabase dashboard → Edge Functions → New Function
// Name it "admin"
// Paste this entire file into the editor
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hashPassphrase(passphrase: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + passphrase)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const { action, passphrase, recovery_phrase, data } = await req.json()

    // Fetch admin config (service role bypasses RLS)
    const { data: admins } = await supabase.from('admin_config').select('*')
    const admin = admins?.[0] ?? null

    // ---- PUBLIC ACTIONS (no passphrase needed) ----

    if (action === 'check_setup') {
      return json({ is_setup: !!admin })
    }

    if (action === 'setup') {
      if (admin) return json({ error: 'Already configured' }, 400)
      if (!passphrase || !recovery_phrase) {
        return json({ error: 'Passphrase and recovery phrase are both required' }, 400)
      }
      const pSalt = crypto.randomUUID()
      const pHash = await hashPassphrase(passphrase, pSalt)
      const rSalt = crypto.randomUUID()
      const rHash = await hashPassphrase(recovery_phrase, rSalt)

      const { error } = await supabase.from('admin_config').insert({
        passphrase_hash: pHash,
        passphrase_salt: pSalt,
        recovery_hash: rHash,
        recovery_salt: rSalt,
      })
      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    if (action === 'recover') {
      if (!admin) return json({ error: 'Not configured yet' }, 400)
      if (!recovery_phrase || !passphrase) {
        return json({ error: 'Recovery phrase and new passphrase required' }, 400)
      }
      const rHash = await hashPassphrase(recovery_phrase, admin.recovery_salt)
      if (rHash !== admin.recovery_hash) {
        return json({ error: 'Invalid recovery phrase' }, 401)
      }
      const newSalt = crypto.randomUUID()
      const newHash = await hashPassphrase(passphrase, newSalt)
      const { error } = await supabase
        .from('admin_config')
        .update({ passphrase_hash: newHash, passphrase_salt: newSalt })
        .eq('id', admin.id)
      if (error) return json({ error: error.message }, 500)
      return json({ success: true })
    }

    // ---- AUTHENTICATED ACTIONS ----

    if (!admin) return json({ error: 'Not configured yet' }, 400)
    if (!passphrase) return json({ error: 'Passphrase required' }, 401)

    const hash = await hashPassphrase(passphrase, admin.passphrase_salt)
    if (hash !== admin.passphrase_hash) {
      return json({ error: 'Invalid passphrase' }, 401)
    }

    switch (action) {
      case 'verify':
        return json({ success: true })

      case 'get_notes': {
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false })
        return json({ notes: notes ?? [] })
      }

      case 'update_location': {
        const { city, country, lat, lng, x_pct, y_pct } = data
        const row: Record<string, unknown> = { city, country, x_pct, y_pct, updated_at: new Date().toISOString() }
        if (lat != null) row.lat = lat
        if (lng != null) row.lng = lng

        const { data: existing } = await supabase
          .from('current_location')
          .select('id')
          .limit(1)
          .single()

        if (existing) {
          const { error } = await supabase
            .from('current_location')
            .update(row)
            .eq('id', existing.id)
          if (error) return json({ error: error.message }, 500)
        } else {
          const { error } = await supabase
            .from('current_location')
            .insert(row)
          if (error) return json({ error: error.message }, 500)
        }
        return json({ success: true })
      }

      case 'add_visited': {
        const { city, country, lat, lng, x_pct, y_pct, date_from, date_to, image_urls } = data
        const row: Record<string, unknown> = {
          city, country, x_pct, y_pct,
          date_from, date_to,
          image_urls: image_urls || [],
        }
        if (lat != null) row.lat = lat
        if (lng != null) row.lng = lng

        const { error } = await supabase.from('visited_places').insert(row)
        if (error) return json({ error: error.message }, 500)
        return json({ success: true })
      }

      case 'update_visited': {
        const { id, ...updates } = data
        const { error } = await supabase
          .from('visited_places')
          .update(updates)
          .eq('id', id)
        if (error) return json({ error: error.message }, 500)
        return json({ success: true })
      }

      case 'delete_visited': {
        const { error } = await supabase
          .from('visited_places')
          .delete()
          .eq('id', data.id)
        if (error) return json({ error: error.message }, 500)
        return json({ success: true })
      }

      case 'add_stop': {
        const { city, country, lat, lng, x_pct, y_pct, note } = data
        const row: Record<string, unknown> = { city, country, x_pct, y_pct, note }
        if (lat != null) row.lat = lat
        if (lng != null) row.lng = lng

        const { error } = await supabase.from('potential_stops').insert(row)
        if (error) return json({ error: error.message }, 500)
        return json({ success: true })
      }

      case 'remove_stop': {
        const { error } = await supabase
          .from('potential_stops')
          .delete()
          .eq('id', data.id)
        if (error) return json({ error: error.message }, 500)
        return json({ success: true })
      }

      case 'export_notes': {
        const { data: notes } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false })

        let filtered = notes ?? []

        if (data?.filter_by === 'person' && data?.value) {
          const q = data.value.toLowerCase()
          filtered = filtered.filter((n: any) =>
            n.author_name.toLowerCase().includes(q)
          )
        }
        if (data?.filter_by === 'location' && data?.value) {
          const q = data.value.toLowerCase()
          filtered = filtered.filter(
            (n: any) =>
              n.location_context &&
              n.location_context.toLowerCase().includes(q)
          )
        }
        if (data?.filter_by === 'recency' && data?.days) {
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - data.days)
          filtered = filtered.filter(
            (n: any) => new Date(n.created_at) >= cutoff
          )
        }

        return json({ notes: filtered, count: filtered.length })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err: any) {
    return json({ error: err.message || 'Internal error' }, 500)
  }
})
