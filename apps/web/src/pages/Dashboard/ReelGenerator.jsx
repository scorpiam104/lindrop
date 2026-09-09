import React, { useState } from 'react';

export default function ReelGenerator({ product }) {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);

  async function startReel() {
    try {
      setLoading(true);
      setStatus('starting');
      const res = await fetch('/api/ai/reels/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ productId: product?._id, style: 'shopify', duration: 15 }),
      });
      if (!res.ok) throw new Error('Failed to start reel job');
      const data = await res.json();
      setJobId(data.jobId);
      pollStatus(data.jobId);
    } catch (err) {
      setStatus('error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function pollStatus(id) {
    setStatus('processing');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/reels/status/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('Status fetch failed');
        const data = await res.json();
        if (data.job && data.job.status === 'completed') {
          clearInterval(interval);
          setStatus('completed');
          setResultUrl(data.job.resultUrl || data.job.url || null);
        }
      } catch (err) {
        clearInterval(interval);
        setStatus('error');
      }
    }, 1500);
  }

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <h3 className="font-bold mb-3">AI Reel Generator</h3>
      <p className="text-sm text-gray-600 mb-3">Create short promotional reels from product listings in one click.</p>

      <div className="flex gap-3">
        <button onClick={startReel} className="btn btn-primary" disabled={loading}>{loading ? 'Starting…' : 'Generate Reel'}</button>
        {jobId && <div className="text-sm text-neutral-600">Job: {jobId}</div>}
      </div>

      {status && (
        <div className="mt-4">
          <div className="text-sm">Status: <strong>{status}</strong></div>
          {status === 'completed' && resultUrl && (
            <div className="mt-2">
              <a className="text-emerald-600 underline" href={resultUrl} target="_blank" rel="noopener noreferrer">Open generated media</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
