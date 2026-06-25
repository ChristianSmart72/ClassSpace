import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpaceStore } from '../store/spaceStore';
import { useContentStore } from '../store/contentStore';
import { TopBar } from '../components/layout';
import { Skeleton, EmptyState } from '../components/ui/Shared';
import { FILE_ICONS, FILE_COLORS, MATERIAL_CATEGORIES } from '../types';
import type { Material } from '../types';

export function CourseFiles() {
  const { id: spaceId, cid } = useParams<{ id: string; cid: string }>();
  const navigate = useNavigate();
  const { courses } = useSpaceStore();
  const { materials, matLoading, fetchMaterials } = useContentStore();

  const course = courses.find((c) => c.id === Number(cid));

  useEffect(() => {
    if (cid) fetchMaterials(Number(cid));
  }, [cid]);

  const grouped = MATERIAL_CATEGORIES.map((cat) => ({
    category: cat,
    items: materials.filter((m) => m.category === cat),
  })).filter((g) => g.items.length > 0);

  if (!course) {
    return (
      <div className="px-4 pt-4">
        <TopBar title="Course Files" onBack={() => navigate(`/space/${spaceId}`)} />
        <p className="text-app-text-dim text-sm font-dm mt-4">Course not found</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <TopBar title={course.name} subtitle={course.code} onBack={() => navigate(`/space/${spaceId}`)} />

      <div className="px-4 mt-4">
        {matLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-16 w-full mb-2" />
              <Skeleton className="h-16 w-full mb-2" />
            </div>
          ))
        ) : materials.length === 0 ? (
          <EmptyState icon="📁" title="No materials yet" subtitle="Upload the first file for this course" />
        ) : (
          grouped.map((group) => (
            <div key={group.category} className="mb-5">
              <h3 className="text-app-text-dim text-xs font-syne font-semibold uppercase tracking-wider mb-2">{group.category}</h3>
              <div className="flex flex-col gap-2">
                {group.items.map((mat) => (
                  <MaterialCard key={mat.id} material={mat} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MaterialCard({ material: m }: { material: Material }) {
  return (
    <div className="bg-app-surface rounded-xl p-3 border border-app-border flex items-center gap-3 active:scale-[0.99] transition-all duration-200">
      <span className={`text-xl ${FILE_COLORS[m.file_type] || 'text-app-text-dim'}`}>
        {FILE_ICONS[m.file_type] || '📁'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-app-text font-dm text-sm font-medium truncate">{m.name}</p>
        <div className="flex items-center gap-2 text-app-text-faint text-[10px] font-dm">
          {m.file_size > 0 && <span>{(m.file_size / 1024 / 1024).toFixed(1)} MB</span>}
          <span>·</span>
          <span>{m.uploader_name || 'Unknown'}</span>
          <span>·</span>
          <span>{m.created_at?.split('T')[0]}</span>
        </div>
      </div>
      <a
        href={`/api/materials/${m.id}/download`}
        download
        className="text-app-accent text-lg px-2 hover:scale-110 transition-transform"
        onClick={(e) => { if (!m.file_data) { e.preventDefault(); alert('Demo file — download available when uploaded'); } }}
      >
        ⬇
      </a>
    </div>
  );
}
