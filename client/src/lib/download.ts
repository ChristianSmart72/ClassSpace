export type DownloadPhase = 'downloading' | 'started' | 'complete' | 'failed';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function downloadMaterialFile(
  material: { id: number; name: string; file_type: string; has_file?: boolean },
  onPhase: (phase: DownloadPhase) => void,
  onProgress?: (percent: number) => void
): Promise<DownloadPhase> {
  const url = `/api/materials/${material.id}/download`;
  onPhase('downloading');
  onProgress?.(0);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);

    if (!res.body) {
      onPhase('started');
      return 'started';
    }

    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total > 0) onProgress?.(Math.min(Math.round((received / total) * 100), 99));
    }

    const blob = new Blob(chunks, { type: res.headers.get('content-type') || 'application/octet-stream' });
    saveBlob(blob, `${material.name}.${material.file_type}`);
    onProgress?.(100);
    onPhase('complete');
    return 'complete';
  } catch {
    // Fall back to the browser's native download (opens in a new tab for
    // cross-origin redirects, but still works reliably).
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
      onPhase('started');
      return 'started';
    } catch {
      onPhase('failed');
      return 'failed';
    }
  }
}
