import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { School, Home, Filter, Check, X, Search, Link as LinkIcon, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SchoolRow {
  id: string;
  name: string;
  city: string;
  province: string;
  student_count: number;
  school_type: string;
  is_active: boolean;
  created_at: string;
}

interface HomeRow {
  id: string;
  name: string;
  city: string;
  province: string;
  child_count: number;
  is_active: boolean;
  created_at: string;
}

interface FundingRequest {
  id: string;
  requester_type: 'school' | 'child_home';
  requester_id: string;
  title: string;
  amount_requested: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ApplicationRow {
  id: string;
  created_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  full_name: string;
  date_of_birth: string | null;
  phone_number: string | null;
  email: string | null;
  id_number: string | null;
  school_name: string | null;
  grade: string | null;
  student_number: string | null;
  academic_performance: string | null;
  household_income: string | null;
  household_size: string | null;
  employment_status: string | null;
  other_income_sources: string | null;
  support_type: string[] | null;
  urgent_needs: string | null;
  previous_support: string | null;
  has_id_document: boolean;
  has_school_report: boolean;
  has_income_proof: boolean;
  has_bank_statement: boolean;
  special_circumstances: string | null;
  community_involvement: string | null;
  references_info: string | null;
  created_at: string;
}

export default function BeneficiariesPage() {
  const [activeTab, setActiveTab] = useState<'schools' | 'homes' | 'requests' | 'applications'>('schools');
  const [search, setSearch] = useState('');
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [homes, setHomes] = useState<HomeRow[]>([]);
  const [requests, setRequests] = useState<FundingRequest[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ApplicationRow | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, h, r, a] = await Promise.all([
        supabase.from('schools').select('*').order('name'),
        supabase.from('child_headed_homes').select('*').order('name'),
        supabase.from('green_scholar_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('green_scholar_applications').select('*').order('created_at', { ascending: false })
      ]);
      if (s.error) throw s.error;
      if (h.error) throw h.error;
      setSchools((s.data || []) as any);
      setHomes((h.data || []) as any);
      setRequests((r.data || []) as any);
      setApplications((a.data || []) as any);
    } catch (e: any) {
      setError(e.message || 'Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(s => [s.name, s.city, s.province, s.school_type].some(x => (x || '').toLowerCase().includes(q)));
  }, [schools, search]);

  const filteredHomes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return homes;
    return homes.filter(h => [h.name, h.city, h.province].some(x => (x || '').toLowerCase().includes(q)));
  }, [homes, search]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(r => [r.title, r.reason, r.requester_type].some(x => (x || '').toLowerCase().includes(q)));
  }, [requests, search]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(a => [a.full_name, a.email, a.phone_number, a.school_name].some(x => (x || '').toLowerCase().includes(q)));
  }, [applications, search]);

  const updateRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'approved') {
      const auth = await supabase.auth.getUser();
      const approverId = auth.data?.user?.id;
      const { error } = await supabase.rpc('approve_green_scholar_request', {
        p_request_id: id,
        p_approver_id: approverId,
        p_note: 'Approved via admin portal'
      });
      if (!error) setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      return;
    }
    const { error } = await supabase
      .from('green_scholar_requests')
      .update({ status })
      .eq('id', id);
    if (!error) setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Beneficiary Management</h1>
          <p className="text-gray-600 mt-1">Manage schools, child-headed homes, requests, and applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="w-80" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="homes">Child Homes</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="schools">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><School className="h-5 w-5 text-blue-600" /> Schools</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filter</Button>
                <AddSchoolButton onCreated={loadAll} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">{error}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSchools.map(s => (
                    <div key={s.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{s.name}</div>
                        <Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{s.city}, {s.province}</div>
                      <div className="text-sm text-gray-600">{s.student_count} students</div>
                      <div className="text-xs text-gray-500 mt-2">Type: {s.school_type}</div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">View</Button>
                        <EditSchoolButton school={s} onSaved={loadAll} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5 text-green-600" /> Child-Headed Homes</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filter</Button>
                <AddHomeButton onCreated={loadAll} />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : error ? (
                <div className="text-center text-red-600 py-8">{error}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHomes.map(h => (
                    <div key={h.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{h.name}</div>
                        <Badge variant={h.is_active ? 'default' : 'secondary'}>{h.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{h.city}, {h.province}</div>
                      <div className="text-sm text-gray-600">{h.child_count} children</div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">View</Button>
                        <EditHomeButton home={h} onSaved={loadAll} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Funding Requests</CardTitle>
                <AddRequestButton onCreated={loadAll} schools={schools} homes={homes} />
              </div>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No requests yet</div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map(r => (
                    <div key={r.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.title}</div>
                        <div className="text-sm text-gray-500">{r.requester_type} • {new Date(r.created_at).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600 mt-1">{r.reason}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Amount</div>
                          <div className="text-lg font-semibold">R {r.amount_requested.toLocaleString()}</div>
                          <div className="mt-1"> <Badge variant={r.status === 'pending' ? 'secondary' : r.status === 'approved' ? 'default' : 'destructive'}>{r.status}</Badge> </div>
                        </div>
                        {r.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateRequestStatus(r.id, 'rejected')}>
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                            <Button size="sm" onClick={() => updateRequestStatus(r.id, 'approved')}>
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No applications yet</div>
              ) : (
                <div className="space-y-3">
                  {filteredApplications.map(a => (
                    <div key={a.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{a.full_name}</div>
                        <div className="text-sm text-gray-500">{a.email || a.phone_number || 'No contact'} • {new Date(a.created_at).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600 mt-1">{a.school_name || '—'}{a.grade ? ` • Grade ${a.grade}` : ''}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={a.status === 'pending' ? 'secondary' : a.status === 'approved' ? 'default' : 'destructive'}>{a.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => setViewing(a)}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {viewing && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setViewing(null)} />
              <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 text-gray-900">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Application Details</h3>
                  <button onClick={() => setViewing(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-800">Full Name</div>
                      <div className="font-medium">{viewing.full_name}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Date of Birth</div>
                      <div className="font-medium">{viewing.date_of_birth || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Email</div>
                      <div className="font-medium break-all">{viewing.email || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Phone</div>
                      <div className="font-medium">{viewing.phone_number || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">ID Number</div>
                      <div className="font-medium break-all">{viewing.id_number || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Status</div>
                      <Badge variant={viewing.status === 'pending' ? 'secondary' : viewing.status === 'approved' ? 'default' : 'destructive'}>{viewing.status}</Badge>
                    </div>
                    <div>
                      <div className="text-gray-800">School</div>
                      <div className="font-medium">{viewing.school_name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Grade</div>
                      <div className="font-medium">{viewing.grade || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-800">Academic Performance</div>
                      <div className="font-medium whitespace-pre-wrap">{viewing.academic_performance || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Household Income</div>
                      <div className="font-medium">{viewing.household_income || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Household Size</div>
                      <div className="font-medium">{viewing.household_size || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Employment Status</div>
                      <div className="font-medium">{viewing.employment_status || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-800">Other Income Sources</div>
                      <div className="font-medium whitespace-pre-wrap">{viewing.other_income_sources || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-800">Support Type</div>
                      <div className="font-medium">{(viewing.support_type || []).join(', ') || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-800">Urgent Needs</div>
                      <div className="font-medium whitespace-pre-wrap">{viewing.urgent_needs || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-800">Previous Support</div>
                      <div className="font-medium whitespace-pre-wrap">{viewing.previous_support || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-800">Documents</div>
                      <div className="font-medium text-sm">ID: {viewing.has_id_document ? 'Yes' : 'No'} • School Report: {viewing.has_school_report ? 'Yes' : 'No'}</div>
                      <div className="font-medium text-sm">Income Proof: {viewing.has_income_proof ? 'Yes' : 'No'} • Bank Statement: {viewing.has_bank_statement ? 'Yes' : 'No'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-800">Special Circumstances</div>
                      <div className="font-medium whitespace-pre-wrap">{viewing.special_circumstances || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-800">Community Involvement</div>
                      <div className="font-medium whitespace-pre-wrap">{viewing.community_involvement || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-gray-800">References</div>
                      <div className="font-medium whitespace-pre-wrap">{viewing.references_info || '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddSchoolButton({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', province: '', school_type: 'primary', student_count: 0 });

  const save = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('schools').insert({
        name: form.name,
        city: form.city,
        province: form.province,
        school_type: form.school_type,
        student_count: Number(form.student_count) || 0
      });
      if (error) throw error;
      setOpen(false);
      onCreated();
    } catch (e) {
      // handle inline in UI if needed
    } finally {
      setSaving(false);
    }
  };

  if (!open) return <Button onClick={() => setOpen(true)}>Add School</Button>;
  return (
    <div className="border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="School name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        <Input placeholder="Province" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
        <Input placeholder="Type (primary/secondary/special_needs)" value={form.school_type} onChange={e => setForm({ ...form, school_type: e.target.value })} />
        <Input placeholder="Student count" type="number" value={form.student_count} onChange={e => setForm({ ...form, student_count: Number(e.target.value) })} />
      </div>
      <div className="flex gap-2 mt-3">
        <Button disabled={saving} onClick={save}>Save</Button>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function AddRequestButton({ onCreated, schools, homes }: { onCreated: () => void; schools: SchoolRow[]; homes: HomeRow[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ requester_type: 'school' | 'child_home'; requester_id: string; title: string; amount: number; reason: string; file_url?: string }>({
    requester_type: 'school',
    requester_id: '',
    title: '',
    amount: 0,
    reason: ''
  });

  const save = async () => {
    try {
      setSaving(true);
      const auth = await supabase.auth.getUser();
      const creator = auth.data?.user?.id || null;
      const { data, error } = await supabase
        .from('green_scholar_requests')
        .insert({
          requester_type: form.requester_type,
          requester_id: form.requester_id,
          title: form.title,
          amount_requested: Number(form.amount) || 0,
          reason: form.reason,
          created_by: creator
        })
        .select('id')
        .single();
      if (error) throw error;
      if (form.file_url) {
        await supabase.from('green_scholar_request_files').insert({
          request_id: data?.id,
          file_url: form.file_url
        });
      }
      setOpen(false);
      onCreated();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (!open) return <Button onClick={() => setOpen(true)}>New Request</Button>;
  return (
    <div className="border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Requester Type</label>
          <select className="border rounded h-9 px-2" value={form.requester_type} onChange={e => setForm({ ...form, requester_type: e.target.value as any, requester_id: '' })}>
            <option value="school">School</option>
            <option value="child_home">Child Home</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Requester</label>
          <select className="border rounded h-9 px-2" value={form.requester_id} onChange={e => setForm({ ...form, requester_id: e.target.value })}>
            <option value="">Select...</option>
            {(form.requester_type === 'school' ? schools : homes).map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} />
        <Input placeholder="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-gray-400" />
          <Input placeholder="Document URL (optional)" value={form.file_url || ''} onChange={e => setForm({ ...form, file_url: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button disabled={saving || !form.requester_id || !form.title || !form.amount} onClick={save}>Create</Button>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function EditSchoolButton({ school, onSaved }: { school: SchoolRow; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: school.name, city: school.city, province: school.province, school_type: school.school_type, student_count: school.student_count, is_active: school.is_active });

  const save = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('schools').update({
        name: form.name,
        city: form.city,
        province: form.province,
        school_type: form.school_type,
        student_count: Number(form.student_count) || 0,
        is_active: !!form.is_active
      }).eq('id', school.id);
      if (error) throw error;
      setOpen(false);
      onSaved();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Edit</Button>;
  return (
    <div className="border rounded-lg p-3 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input placeholder="School name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        <Input placeholder="Province" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
        <Input placeholder="Type" value={form.school_type} onChange={e => setForm({ ...form, school_type: e.target.value })} />
        <Input placeholder="Student count" type="number" value={form.student_count} onChange={e => setForm({ ...form, student_count: Number(e.target.value) })} />
      </div>
      <div className="flex gap-2 mt-2">
        <Button size="sm" disabled={saving} onClick={save}>Save</Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function AddHomeButton({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', province: '', child_count: 0 });
  const save = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('child_headed_homes').insert({
        name: form.name,
        city: form.city,
        province: form.province,
        child_count: Number(form.child_count) || 0
      });
      if (error) throw error;
      setOpen(false);
      onCreated();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };
  if (!open) return <Button onClick={() => setOpen(true)}>Add Home</Button>;
  return (
    <div className="border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="Home name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        <Input placeholder="Province" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
        <Input placeholder="Children" type="number" value={form.child_count} onChange={e => setForm({ ...form, child_count: Number(e.target.value) })} />
      </div>
      <div className="flex gap-2 mt-3">
        <Button disabled={saving} onClick={save}>Save</Button>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

function EditHomeButton({ home, onSaved }: { home: HomeRow; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: home.name, city: home.city, province: home.province, child_count: home.child_count, is_active: true });
  const save = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('child_headed_homes').update({
        name: form.name,
        city: form.city,
        province: form.province,
        child_count: Number(form.child_count) || 0,
        is_active: !!form.is_active
      }).eq('id', home.id);
      if (error) throw error;
      setOpen(false);
      onSaved();
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };
  if (!open) return <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Edit</Button>;
  return (
    <div className="border rounded-lg p-3 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input placeholder="Home name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
        <Input placeholder="Province" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
        <Input placeholder="Children" type="number" value={form.child_count} onChange={e => setForm({ ...form, child_count: Number(e.target.value) })} />
      </div>
      <div className="flex gap-2 mt-2">
        <Button size="sm" disabled={saving} onClick={save}>Save</Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
