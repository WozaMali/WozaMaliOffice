'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UnifiedCollectorService } from '../lib/unified-collector-service';

interface Material {
  id: string;
  name: string;
  unit_price: number;
  description?: string;
}

interface Resident {
  id: string;
  name: string;
  email?: string;
}

interface CollectionFormProps {
  collectorId: string;
  residentId?: string; // Pre-select resident if provided
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean; // Whether to render as modal or full page
}

export default function CollectionForm({ collectorId, residentId, onSuccess, onCancel, isModal = false }: CollectionFormProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [residentSearch, setResidentSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    resident_id: residentId || '',
    materials: [{ material_id: '', weight_kg: '', unit_price: '' }],
    notes: ''
  });
  const [weightPhotoFile, setWeightPhotoFile] = useState<File | null>(null);
  const [materialPhotoFile, setMaterialPhotoFile] = useState<File | null>(null);
  const [weightPhotoPreview, setWeightPhotoPreview] = useState<string | null>(null);
  const [materialPhotoPreview, setMaterialPhotoPreview] = useState<string | null>(null);
  const weightInputRef = useRef<HTMLInputElement | null>(null);
  const materialInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadInitialData();
    // Watchdog to avoid being stuck
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load materials (non-blocking)
      try {
        const { data: materialsData } = await supabase
          .from('materials')
          .select('id, name, unit_price, rate_per_kg, current_rate')
          .order('name');
        const normalized = (materialsData || []).map((m: any) => ({
          id: String(m.id),
          name: m.name,
          unit_price: Number(m.current_rate ?? m.unit_price ?? m.rate_per_kg ?? 0)
        }));
        setMaterials(normalized as any);
      } catch (e) {
        console.warn('Materials failed to load:', (e as any)?.message || e);
      }

      // Load residents (non-blocking)
      try {
        const list = await loadResidents('');
        // Fallback: try user_profiles minimal query if list is empty
        if ((list || []).length === 0) {
          const { data: ups } = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .order('full_name', { ascending: true })
            .limit(100);
          const mapped = (ups || []).map((p: any) => ({ id: String(p.id), name: p.full_name || 'Resident', email: '' }));
          if (mapped.length > 0) setResidents(mapped);
        }
      } catch (e) {
        console.warn('Residents failed to load:', (e as any)?.message || e);
      }

      if (materials.length === 0 && residents.length === 0) {
        setError('Some data failed to load. Try again or continue with available fields.');
      }
    } catch (e) {
      setError('Failed to load form data.');
    } finally {
      setLoading(false);
    }
  };

  const loadResidents = async (term: string) => {
    try {
      const { data } = await UnifiedCollectorService.getAllResidents();
      const all = (data || []).map((r: any) => ({
        id: String(r.id),
        name: (r.full_name && String(r.full_name).trim())
          || `${r.first_name || ''} ${r.last_name || ''}`.trim()
          || r.name
          || r.email
          || 'Resident',
        email: r.email || ''
      }));
      const t = (term || '').trim().toLowerCase();
      const filtered = t
        ? all.filter(x => x.name.toLowerCase().includes(t) || x.email?.toLowerCase().includes(t))
        : all;
      setResidents(filtered.slice(0, 100));
      return filtered.slice(0, 100);
    } catch {
      setResidents([]);
      return [] as Resident[];
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop();
      const path = `collection-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('collection-photos').upload(path, file, { upsert: false });
      if (error) {
        console.warn('Photo upload failed:', error.message);
        return null;
      }
      const { data } = supabase.storage.from('collection-photos').getPublicUrl(path);
      return data.publicUrl || null;
    } catch (e) {
      console.warn('Photo upload exception:', e);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selected = (formData.materials || []).filter(m => m.material_id && Number(m.weight_kg) > 0);
    if (!formData.resident_id || selected.length === 0) {
      setError('Please select a resident and add at least one material with weight.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Build materials map
      const idToMat = new Map(materials.map(m => [m.id, m]));
      const total_weight_kg = selected.reduce((s, m) => s + Number(m.weight_kg || 0), 0);
      const total_value = selected.reduce((s, m) => {
        const mat = idToMat.get(m.material_id);
        const enteredRate = Number((m as any).unit_price || NaN);
        const rate = Number.isFinite(enteredRate) && enteredRate > 0 ? enteredRate : Number(mat?.unit_price || 0);
        return s + (Number(m.weight_kg || 0) * rate);
      }, 0);

      // Upload photos if provided
      const weightUrl = weightPhotoFile ? await uploadPhoto(weightPhotoFile) : null;
      const materialUrl = materialPhotoFile ? await uploadPhoto(materialPhotoFile) : null;

      // Insert unified collection
      const { data: uc, error: ucErr } = await supabase
        .from('unified_collections')
        .insert({
          customer_id: formData.resident_id,
          collector_id: collectorId,
          created_by: collectorId,
          total_weight_kg: Number(total_weight_kg.toFixed(2)),
          total_value: Number(total_value.toFixed(2)),
          status: 'pending'
        })
        .select('id')
        .single();
      if (ucErr || !uc?.id) throw ucErr || new Error('Failed to create collection');

      // Insert collection materials
      const rows = selected.map(m => ({
        collection_id: uc.id,
        material_id: m.material_id,
        quantity: Number(m.weight_kg),
        unit_price: (Number((m as any).unit_price) > 0 ? Number((m as any).unit_price) : Number(idToMat.get(m.material_id)?.unit_price || 0))
      }));
      if (rows.length > 0) {
        const { error: cmErr } = await supabase.from('collection_materials').insert(rows);
        if (cmErr) throw cmErr;
      }

      // Save photos if URLs exist (best effort)
      const photoRows: any[] = [];
      if (weightUrl) photoRows.push({ collection_id: uc.id, photo_url: weightUrl, photo_type: 'before', uploaded_by: collectorId });
      if (materialUrl) photoRows.push({ collection_id: uc.id, photo_url: materialUrl, photo_type: 'general', uploaded_by: collectorId });
      if (photoRows.length > 0) {
        try {
          await supabase.from('collection_photos').insert(photoRows);
        } catch (e) {
          console.warn('Skipping collection_photos insert:', (e as any)?.message || e);
        }
      }

      setSuccess('Collection created successfully.');
      setFormData({ resident_id: residentId || '', materials: [{ material_id: '', weight_kg: '', unit_price: '' }], notes: '' });
      setWeightPhotoFile(null);
      setMaterialPhotoFile(null);
      setWeightPhotoPreview(null);
      setMaterialPhotoPreview(null);
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      setError('Failed to create collection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && materials.length === 0) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-2">Loading…</span>
      </div>
    );
  }

  return (
    <div className={`${isModal ? 'p-6 bg-gray-800 rounded-xl border border-gray-700' : 'bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${isModal ? 'text-white' : 'text-gray-900'}`}>Create New Collection</h2>
        {onCancel && (
          <button onClick={onCancel} className={`${isModal ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>✕</button>
        )}
      </div>

      {error && <div className={`${isModal ? 'bg-red-900/30 text-red-200 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200'} mb-4 p-3 rounded`}>{error}</div>}
      {success && <div className={`${isModal ? 'bg-green-900/30 text-green-200 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200'} mb-4 p-3 rounded`}>{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resident */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Resident *</label>
          <input
            value={residentSearch}
            onChange={async (e) => { setResidentSearch(e.target.value); await loadResidents(e.target.value); }}
            placeholder="Search residents by name or email"
            className={`w-full px-3 py-2 mb-2 rounded-lg focus:ring-2 focus:ring-yellow-500 ${isModal ? 'bg-gray-700 border border-gray-600 text-white' : 'border border-gray-300'}`}
          />
          <select
            value={formData.resident_id}
            onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-yellow-500 ${isModal ? 'bg-gray-700 border border-gray-600 text-white' : 'border border-gray-300'}`}
            required
          >
            <option value="">Choose a resident…</option>
            {residents.map(r => (
              <option key={r.id} value={r.id}>{r.name} - {r.email}</option>
            ))}
          </select>
        </div>

        {/* Materials (multiple) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`block text-sm font-medium ${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Materials</label>
            <button type="button" onClick={() => setFormData(prev => ({ ...prev, materials: [...prev.materials, { material_id: '', weight_kg: '', unit_price: '' }] }))} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm">Add Material</button>
          </div>
          <div className="space-y-3">
            {formData.materials.map((row, idx) => (
              <div key={idx} className={`grid grid-cols-1 md:grid-cols-4 gap-3 ${isModal ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-3`}>
                <div>
                  <label className={`block text-xs mb-1 ${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Material</label>
                  <select
                    value={row.material_id}
                    onChange={(e) => {
                      const materialsArr = [...formData.materials];
                      materialsArr[idx].material_id = e.target.value;
                      const mat = materials.find(m => String(m.id) === String(e.target.value));
                      (materialsArr[idx] as any).unit_price = String(mat?.unit_price ?? '');
                      setFormData({ ...formData, materials: materialsArr });
                    }}
                    className={`w-full px-3 py-2 rounded ${isModal ? 'bg-gray-600 border border-gray-500 text-white' : 'border border-gray-300'}`}
                    required
                  >
                    <option value="">Choose…</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={row.weight_kg}
                    onChange={(e) => {
                      const materialsArr = [...formData.materials];
                      materialsArr[idx].weight_kg = e.target.value;
                      setFormData({ ...formData, materials: materialsArr });
                    }}
                    className={`w-full px-3 py-2 rounded ${isModal ? 'bg-gray-600 border border-gray-500 text-white' : 'border border-gray-300'}`}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs mb-1 ${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Rate (R/kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(row as any).unit_price || ''}
                    onChange={(e) => {
                      const materialsArr = [...formData.materials];
                      (materialsArr[idx] as any).unit_price = e.target.value;
                      setFormData({ ...formData, materials: materialsArr });
                    }}
                    className={`w-full px-3 py-2 rounded ${isModal ? 'bg-gray-600 border border-gray-500 text-white' : 'border border-gray-300'}`}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, materials: prev.materials.filter((_, i) => i !== idx) }))} className={`w-full px-3 py-2 rounded ${isModal ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className={`${isModal ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'} rounded-lg p-3`}>
          {(() => {
            const idToMat = new Map(materials.map(m => [m.id, m]));
            const selected = (formData.materials || []).filter((m: any) => m.material_id && Number(m.weight_kg) > 0);
            const total_weight_kg = selected.reduce((s: number, m: any) => s + Number(m.weight_kg || 0), 0);
            const total_value = selected.reduce((s: number, m: any) => {
              const mat = idToMat.get(m.material_id);
              const enteredRate = Number(m.unit_price || NaN);
              const rate = Number.isFinite(enteredRate) && enteredRate > 0 ? enteredRate : Number(mat?.unit_price || 0);
              return s + (Number(m.weight_kg || 0) * rate);
            }, 0);
            return (
              <div className="flex items-center justify-between text-sm">
                <div className={`${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Total Weight</div>
                <div className={`${isModal ? 'text-white' : 'text-gray-900'} font-medium`}>{total_weight_kg.toFixed(2)} kg</div>
                <div className={`${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Estimated Value</div>
                <div className={`${isModal ? 'text-white' : 'text-gray-900'} font-medium`}>R {total_value.toFixed(2)}</div>
              </div>
            );
          })()}
        </div>

        {/* Notes */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className={`w-full px-3 py-2 rounded-lg ${isModal ? 'bg-gray-700 border border-gray-600 text-white' : 'border border-gray-300'}`}
            rows={3}
            placeholder="Add any notes about this collection..."
          />
        </div>

        {/* Optional Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Weight Photo (Optional)</label>
            <input ref={weightInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setWeightPhotoFile(f);
              if (f) {
                const reader = new FileReader();
                reader.onload = (ev) => setWeightPhotoPreview(ev.target?.result as string);
                reader.readAsDataURL(f);
              } else setWeightPhotoPreview(null);
            }} className="hidden" />
            <button type="button" onClick={() => weightInputRef.current?.click()} className={`${isModal ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} w-full px-3 py-2 rounded-lg border ${isModal ? 'border-gray-600' : 'border-gray-300'} transition`}>Use Camera</button>
            {weightPhotoPreview && <img src={weightPhotoPreview} alt="Weight preview" className="mt-2 w-32 h-32 object-cover rounded" />}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isModal ? 'text-gray-300' : 'text-gray-700'}`}>Material Photo (Optional)</label>
            <input ref={materialInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setMaterialPhotoFile(f);
              if (f) {
                const reader = new FileReader();
                reader.onload = (ev) => setMaterialPhotoPreview(ev.target?.result as string);
                reader.readAsDataURL(f);
              } else setMaterialPhotoPreview(null);
            }} className="hidden" />
            <button type="button" onClick={() => materialInputRef.current?.click()} className={`${isModal ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'} w-full px-3 py-2 rounded-lg border ${isModal ? 'border-gray-600' : 'border-gray-300'} transition`}>Use Camera</button>
            {materialPhotoPreview && <img src={materialPhotoPreview} alt="Material preview" className="mt-2 w-32 h-32 object-cover rounded" />}
          </div>
        </div>

        <div className="flex space-x-3">
          <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition">
            {loading ? 'Creating…' : 'Create Collection'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className={`${isModal ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} px-4 py-2 border rounded-lg transition`}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
