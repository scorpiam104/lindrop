import React, { useEffect, useState } from 'react';

export default function MerchantSocialSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    whatsappNumber: '',
    telegramUsername: '',
    supportEmail: '',
    instagramHandle: '',
    facebookPageUrl: '',
    twitterHandle: '',
    tiktokHandle: '',
    linkedinUrl: '',
    youtubeChannelUrl: '',
    pinterestUsername: '',
    threadsHandle: '',
    metaAccessToken: '',
    facebookPageId: '',
    instagramBusinessAccountId: '',
  });

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      try {
        const res = await fetch('/api/merchant/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load merchant profile');
        const data = await res.json();
        if (!mounted) return;
        const contact = data.contactDetails || {};
        const social = data.socialHandles || {};
        const connections = data.socialConnections || {};

        setForm({
          whatsappNumber: contact.whatsappNumber || '',
          telegramUsername: contact.telegramUsername || '',
          supportEmail: contact.supportEmail || '',
          instagramHandle: social.instagramHandle || '',
          facebookPageUrl: social.facebookPageUrl || '',
          twitterHandle: social.twitterHandle || '',
          tiktokHandle: social.tiktokHandle || '',
          linkedinUrl: social.linkedinUrl || '',
          youtubeChannelUrl: social.youtubeChannelUrl || '',
          pinterestUsername: social.pinterestUsername || '',
          threadsHandle: social.threadsHandle || '',
          metaAccessToken: '',
          facebookPageId: connections.facebookPageId || '',
          instagramBusinessAccountId: connections.instagramBusinessAccountId || '',
        });
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  function updateField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        contactDetails: {
          whatsappNumber: form.whatsappNumber || null,
          telegramUsername: form.telegramUsername || null,
          supportEmail: form.supportEmail || null,
        },
        socialHandles: {
          instagramHandle: form.instagramHandle || null,
          facebookPageUrl: form.facebookPageUrl || null,
          twitterHandle: form.twitterHandle || null,
          tiktokHandle: form.tiktokHandle || null,
          linkedinUrl: form.linkedinUrl || null,
          youtubeChannelUrl: form.youtubeChannelUrl || null,
          pinterestUsername: form.pinterestUsername || null,
          threadsHandle: form.threadsHandle || null,
        },
        ...(form.metaAccessToken ? { socialConnections: { metaAccessToken: form.metaAccessToken, facebookPageId: form.facebookPageId || null, instagramBusinessAccountId: form.instagramBusinessAccountId || null } } : {}),
      };

      const res = await fetch('/api/merchant/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save');
      }

      setSuccess('Social settings saved');
      setForm(prev => ({ ...prev, metaAccessToken: '' }));
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading social settings…</div>;

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Social Channels & Contact</h2>

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {success && <div className="text-green-600 mb-3">{success}</div>}

      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm">WhatsApp Number</div>
            <input value={form.whatsappNumber} onChange={e => updateField('whatsappNumber', e.target.value)} placeholder="+233..." className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">Telegram Username</div>
            <input value={form.telegramUsername} onChange={e => updateField('telegramUsername', e.target.value)} placeholder="@yourshop" className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">Support Email</div>
            <input value={form.supportEmail} onChange={e => updateField('supportEmail', e.target.value)} placeholder="support@store.com" type="email" className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">Instagram Handle</div>
            <input value={form.instagramHandle} onChange={e => updateField('instagramHandle', e.target.value)} placeholder="yourshop" className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">Facebook Page URL</div>
            <input value={form.facebookPageUrl} onChange={e => updateField('facebookPageUrl', e.target.value)} placeholder="https://facebook.com/yourpage" className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">Twitter / X Handle</div>
            <input value={form.twitterHandle} onChange={e => updateField('twitterHandle', e.target.value)} placeholder="@yourshop" className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">TikTok Handle</div>
            <input value={form.tiktokHandle} onChange={e => updateField('tiktokHandle', e.target.value)} placeholder="@yourshop" className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">LinkedIn URL</div>
            <input value={form.linkedinUrl} onChange={e => updateField('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/company/..." className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">YouTube Channel URL</div>
            <input value={form.youtubeChannelUrl} onChange={e => updateField('youtubeChannelUrl', e.target.value)} placeholder="https://youtube.com/channel/..." className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">Pinterest Username</div>
            <input value={form.pinterestUsername} onChange={e => updateField('pinterestUsername', e.target.value)} placeholder="@yourshop" className="mt-1 w-full input" />
          </label>

          <label className="block">
            <div className="text-sm">Threads Handle</div>
            <input value={form.threadsHandle} onChange={e => updateField('threadsHandle', e.target.value)} placeholder="@yourshop" className="mt-1 w-full input" />
          </label>
        </div>

        <hr className="my-3" />

        <div>
          <div className="text-sm font-medium mb-2">Direct API Posting (optional)</div>
          <div className="text-xs text-neutral-500 mb-2">
            If you want the platform to post directly to your Facebook/Instagram page, paste a long‑lived Meta access token and the Page/Business IDs. Tokens are sensitive — only add if you understand the security implications.
          </div>

          <label className="block mb-2">
            <div className="text-sm">Meta Access Token (paste only if you want direct posting)</div>
            <input value={form.metaAccessToken} onChange={e => updateField('metaAccessToken', e.target.value)} placeholder="EAAX..." className="mt-1 w-full input" />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-sm">Facebook Page ID</div>
              <input value={form.facebookPageId} onChange={e => updateField('facebookPageId', e.target.value)} placeholder="1234567890" className="mt-1 w-full input" />
            </label>

            <label className="block">
              <div className="text-sm">Instagram Business Account ID</div>
              <input value={form.instagramBusinessAccountId} onChange={e => updateField('instagramBusinessAccountId', e.target.value)} placeholder="987654321" className="mt-1 w-full input" />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving…' : 'Save Social Settings'}
          </button>
          <button type="button" onClick={() => { setForm(prev => ({ ...prev, metaAccessToken: '' })); }} className="btn">
            Clear Token Field
          </button>
        </div>
      </form>
    </div>
  );
}
