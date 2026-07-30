import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { canGoBack } from '../lib/time';

const DEMO_LINKS = [
  { label: 'Space Preview', link: 'classspace.app/s/pre220' },
  { label: 'Announcement Preview', link: 'classspace.app/s/pre220/ann/1' },
  { label: 'Material Preview', link: 'classspace.app/s/pre220/mat/101' },
  { label: 'Course Folder Preview', link: 'classspace.app/s/pre220/course/1' },
];

export function JoinInput() {
  const [link, setLink] = useState('');
  const navigate = useNavigate();

  const handlePreview = () => {
    const parsed = parseLink(link);
    if (!parsed) return;
    const { type, id } = parsed;
    navigate(`/join/${type}/${id}`);
  };

  const demoLink = (l: string) => {
    setLink(l);
  };

  return (
    <div className="min-h-dvh flex flex-col px-6 py-8">
      <button onClick={() => canGoBack() ? navigate(-1) : navigate('/')} className="text-app-text-dim hover:text-app-text text-lg mb-6 self-start">←</button>

      <h2 className="text-xl font-jakarta font-bold text-app-text mb-1">Join a Space</h2>
      <p className="text-app-text-dim text-sm font-inter mb-6">Paste a ClassSpace link to preview and join</p>

      <div>
        <label className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-1.5 block">
          Link
        </label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="classspace.app/s/abc123"
          className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-app-text font-inter text-sm placeholder:text-app-text-faint focus:border-app-accent transition-colors"
        />
      </div>

      <button
        onClick={handlePreview}
        disabled={!link.trim()}
        className="w-full bg-app-accent text-app-bg font-jakarta font-bold text-sm rounded-xl py-3.5 mt-4 active:scale-[0.98] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Preview
      </button>

      {/* Preview Card */}
      {link && (
        <div className="mt-4 bg-app-surface rounded-2xl p-4 border border-app-border animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getLinkIcon(link)}</span>
            <div>
              <p className="text-app-text font-inter text-sm font-medium">{getLinkLabel(link)}</p>
              <p className="text-app-text-dim text-xs font-inter">{link}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="text-app-text-dim text-xs font-jakarta font-semibold uppercase tracking-wider mb-3">Try a demo link</p>
        <div className="flex flex-col gap-2">
          {DEMO_LINKS.map((d) => (
            <button
              key={d.label}
              onClick={() => demoLink(d.link)}
              className="text-left bg-app-surface rounded-xl px-4 py-3 border border-app-border active:scale-[0.98] transition-all duration-200"
            >
              <p className="text-app-text font-inter text-sm">{d.label}</p>
              <p className="text-app-text-dim text-xs font-inter mt-0.5">{d.link}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function parseLink(raw: string): { type: string; id: string } | null {
  const cleaned = raw.trim().replace(/^https?:\/\//, '');

  // Match: classspace.app/s/:id, classspace.app/s/:id/ann|mat|course/:n
  const shortMatch = cleaned.match(/classspace\.app\/s\/([a-z0-9-]+)(?:\/(ann|mat|course)\/(\d+))?/);
  if (shortMatch) {
    const spaceId = shortMatch[1];
    const subType = shortMatch[2];
    const subId = shortMatch[3];
    if (subType && subId) return { type: subType, id: subId };
    return { type: 'space', id: spaceId };
  }

  // Match: classspace.app/join/space/:code
  const joinMatch = cleaned.match(/classspace\.app\/join\/(space|ann|mat|course)\/([a-z0-9-]+)/);
  if (joinMatch) return { type: joinMatch[1], id: joinMatch[2] };

  // Match: raw invite code (e.g. PRE220, abc123)
  if (/^[A-Z0-9]{4,12}$/i.test(cleaned)) return { type: 'space', id: cleaned };

  return null;
}

function getLinkIcon(link: string): string {
  const parsed = parseLink(link);
  if (!parsed) return '🔗';
  switch (parsed.type) {
    case 'space': return '📋';
    case 'ann': return '📢';
    case 'mat': return '📄';
    case 'course': return '📁';
    default: return '🔗';
  }
}

function getLinkLabel(link: string): string {
  const parsed = parseLink(link);
  if (!parsed) return 'Invalid link';
  switch (parsed.type) {
    case 'space': return 'Space';
    case 'ann': return 'Announcement';
    case 'mat': return 'Material';
    case 'course': return 'Course Folder';
    default: return 'ClassSpace Link';
  }
}
