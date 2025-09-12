import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { collectionId } = await req.json().catch(() => ({}));
    if (!collectionId || typeof collectionId !== 'string') {
      return NextResponse.json({ error: 'collectionId required' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Service key not configured' }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Helper to ignore missing-table errors gracefully
    const safeDelete = async (table: string, match: Record<string, any>): Promise<{ ok: boolean; message?: string }> => {
      try {
        const { error } = await supabase.from(table).delete().match(match);
        if (error) return { ok: false, message: error.message };
        return { ok: true };
      } catch (e: any) {
        return { ok: false, message: e?.message || String(e) };
      }
    };

    // Prefer SECURITY DEFINER RPC if available (bypasses RLS cleanly)
    try {
      const { error: rpcErr } = await (supabase as any).rpc('admin_delete_collection', { _id: collectionId });
      if (!rpcErr) {
        return NextResponse.json({ ok: true, via: 'rpc' }, { status: 200 });
      }
      // eslint-disable-next-line no-console
      console.debug('RPC admin_delete_collection not available or failed, falling back to direct deletes:', rpcErr?.message);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.debug('RPC call exception, falling back to direct deletes:', e?.message || e);
    }

    // Delete children in parallel
    // Wallet transactions may reference the collection via different fields across environments
    const deleteWalletTransactions = async () => {
      // Primary canonical link based on your schema: source_id = collectionId
      const primary = await safeDelete('wallet_transactions', { source_id: collectionId });
      // Also clear by type just in case (collection_approval records)
      const typed = await safeDelete('wallet_transactions', { source_id: collectionId, source_type: 'collection_approval' });
      return [primary, typed];
    };

    const children = [
      await safeDelete('collection_photos', { collection_id: collectionId }),
      await safeDelete('collection_materials', { collection_id: collectionId }),
      // Ensure Main app History no longer shows this by removing queue entries
      await safeDelete('wallet_update_queue', { collection_id: collectionId }),
      ...(await deleteWalletTransactions()),
      await safeDelete('transactions', { source_id: collectionId })
    ];

    // Delete parents in parallel
    const parents = await Promise.all([
      safeDelete('unified_collections', { id: collectionId }),
      safeDelete('collections', { id: collectionId })
    ]);

    // Verify deletion actually happened (avoid false positive OK)
    const verifyUnified = await supabase
      .from('unified_collections')
      .select('id')
      .eq('id', collectionId)
      .maybeSingle();

    const verifyLegacy = await supabase
      .from('collections')
      .select('id')
      .eq('id', collectionId)
      .maybeSingle();

    // Also verify no wallet_transactions or wallet_update_queue remain linked by common patterns
    const verifyWalletTx = await (async () => {
      try {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('source_id', collectionId)
          .limit(1);
        if (error) return { remaining: false };
        return { remaining: Array.isArray(data) && data.length > 0 };
      } catch { return { remaining: false }; }
    })();

    const verifyQueue = await (async () => {
      try {
        const { data, error } = await supabase
          .from('wallet_update_queue')
          .select('collection_id')
          .eq('collection_id', collectionId)
          .limit(1);
        if (error) return { remaining: false };
        return { remaining: Array.isArray(data) && data.length > 0 };
      } catch {
        return { remaining: false };
      }
    })();

    if ((!verifyUnified.error && verifyUnified.data) || (!verifyLegacy.error && verifyLegacy.data) || verifyWalletTx.remaining || verifyQueue.remaining) {
      const reasons = [...children, ...parents].filter(r => !r.ok).map(r => r.message).filter(Boolean);
      return NextResponse.json({ ok: false, reason: 'not_deleted', details: reasons }, { status: 409 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}


