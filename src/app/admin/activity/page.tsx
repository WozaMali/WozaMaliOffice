"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EventRow {
	id: string;
	user_id: string;
	event_type: 'login' | 'logout' | 'soft_logout' | 'unlock';
	reason: string | null;
	created_at: string;
	user_email?: string | null;
}

export default function AdminActivityPage() {
	const [events, setEvents] = useState<EventRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = async () => {
		setLoading(true);
		setError(null);
    try {
        // Use secure RPC that bypasses RLS for superadmins
        const { data, error } = await supabase.rpc('get_admin_session_events', { p_limit: 200 });
        if (error) throw error;
        const withEmails = await Promise.all((data || []).map(async (e: any) => {
            try {
                const { data: u } = await supabase.from('users').select('email').eq('id', e.user_id).maybeSingle();
                return { ...e, user_email: u?.email || null } as EventRow;
            } catch {
                return { ...e, user_email: null } as EventRow;
            }
        }))
        setEvents(withEmails);
    } catch (e: any) {
			setError(e?.message || 'Failed to load activity');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	return (
		<AdminLayout currentPage={'/admin/activity'}>
			<Card className="shadow-card">
				<CardHeader>
					<CardTitle>Admin Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex justify-between items-center mb-3">
						<div className="text-sm text-muted-foreground">Logins, soft sign-outs, unlocks</div>
						<Button size="sm" onClick={load} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>
					</div>
					{error && <div className="text-sm text-red-600 mb-2">{error}</div>}
					<div className="space-y-2">
						{events.map(ev => (
							<div key={ev.id} className="flex items-center justify-between border rounded-md p-2">
								<div className="space-y-0.5">
									<div className="text-sm font-medium capitalize">{ev.event_type.replace('_',' ')}</div>
									<div className="text-xs text-muted-foreground">{ev.user_email || ev.user_id}</div>
								</div>
								<div className="text-right">
									{ev.reason && <div className="text-xs">Reason: {ev.reason}</div>}
									<div className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</div>
								</div>
							</div>
						))}
						{!loading && events.length === 0 && (
							<div className="text-sm text-muted-foreground">No activity yet.</div>
						)}
					</div>
				</CardContent>
			</Card>
		</AdminLayout>
	);
}
