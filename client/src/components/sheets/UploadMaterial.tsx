import { useState, useRef } from 'react';
import { useSpaceStore } from '../../store/spaceStore';
import { useContentStore } from '../../store/contentStore';
import { MATERIAL_CATEGORIES, FILE_ICONS, FILE_COLORS } from '../../types';

export function UploadMaterialSheet({ courseId: preselected, onClose }: {
  courseId?: number; onClose: () => void;
}) {
  const { courses } = useSpaceStore();
  const { uploadMaterial } = useContentStore();
  const [courseId, setCourseId] = useState<number>(preselected || courses[0]?.id || 0);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Notes');
  const [file, setFile] = useState<{ name: string; size: number; type: string; dataUrl: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const ext = f.name.split('.').pop()?.toLowerCase() || 'other';
    const fileTypeMap: Record<string, string> = {
      pdf: 'pdf', doc: 'doc', docx: 'doc', ppt: 'ppt', pptx: 'ppt',
      xls: 'xls', xlsx: 'xls', png: 'img', jpg: 'img', jpeg: 'img',
      gif: 'img', svg: 'img', mp4: 'video', mov: 'video',
    };

    const reader = new FileReader();
    reader.onload = () => {
      setFile({
        name: f.name,
        size: f.size,
        type: fileTypeMap[ext] || 'other',
        dataUrl: (reader.result as string).split(',')[1],
      });
      if (!name) setName(f.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file'); return; }
    if (!name.trim()) { setError('Please enter a name'); return; }
    if (!courseId) { setError('Please select a course'); return; }

    setSubmitting(true);
    setError('');
    try {
      await uploadMaterial(courseId, {
        name,
        file_data: file.dataUrl,
        file_size: file.size,
        file_type: file.type,
        category,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-[430px] mx-auto bg-app-bg rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-app-bg border-b border-app-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-app-text font-syne font-bold text-base">Upload Material</h2>
          <button onClick={onClose} className="text-app-text-dim text-lg">&times;</button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && <p className="text-app-red text-sm font-dm">{error}</p>}

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Course</label>
            <select value={courseId} onChange={(e) => setCourseId(Number(e.target.value))}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm appearance-none">
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">File</label>
            <input ref={fileRef} type="file" onChange={handleFile} className="hidden" />
            {file ? (
              <div className="bg-app-surface rounded-xl p-3 border border-app-border flex items-center gap-3">
                <span className={`text-xl ${FILE_COLORS[file.type] || 'text-app-text-dim'}`}>{FILE_ICONS[file.type] || '📁'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-app-text font-dm text-sm truncate">{file.name}</p>
                  <p className="text-app-text-faint text-xs font-dm">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <button onClick={() => { setFile(null); fileRef.current?.click(); }} className="text-app-accent text-sm font-syne font-semibold">Change</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full bg-app-surface border-2 border-dashed border-app-border rounded-xl py-8 text-center hover:border-app-accent transition-colors cursor-pointer">
                <span className="text-2xl block mb-1">📁</span>
                <span className="text-app-text-dim text-sm font-dm">Tap to select a file</span>
              </button>
            )}
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Material name"
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors" />
          </div>

          <div>
            <label className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-1.5 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-dm text-sm appearance-none">
              {MATERIAL_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <button onClick={handleSubmit} disabled={submitting || !file}
            className="w-full bg-app-accent text-app-bg font-syne font-bold text-sm rounded-xl py-3.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
            {submitting ? 'Uploading...' : 'Upload Material'}
          </button>
        </div>
      </div>
    </div>
  );
}
