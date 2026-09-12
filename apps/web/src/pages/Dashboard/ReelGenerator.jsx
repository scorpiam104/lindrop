import { useEffect, useRef, useState } from 'react';
import { apiCall } from '../../lib/session';

export default function ReelGenerator({ product }) {
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  async function startReel() {
    try {
      setLoading(true);
      setStatus('starting');
      const { data } = await apiCall('post', '/ai/reels/generate', { productId: product?._id, style: 'shopify', duration: 15 });
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
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await apiCall('get', `/ai/reels/status/${id}`);
        if (data.job && data.job.status === 'completed') {
          clearInterval(intervalRef.current);
          setStatus('completed');
          setResultUrl(data.job.resultUrl || data.job.url || null);
        }
      } catch (err) {
        clearInterval(intervalRef.current);
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
