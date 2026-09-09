import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  MessageSquare,
  Play,
  Save,
  Trash2,
  Twitter,
  X,
  Youtube,
} from 'lucide-react';
import { apiCall, getMerchant, saveSession } from '../lib/session';
import { DashboardLayout } from './Platform';

function SocialIcon({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={18} className="text-black/50" />
      <span className="text-sm font-semibold text-black/70">{label}</span>
    </div>
  );
}

function SocialField({ label, value, onChange, placeholder, icon: Icon }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-black/70">
        {Icon && <Icon size={16} className="text-emerald-600" />}
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
      />
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-black text-black">{title}</h3>
        {description && <p className="mt-1 text-sm text-black/50">{description}</p>}
      </div>
      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}

export function MerchantSocialSettings() {
  const [merchant, setMerchant] = useState(getMerchant());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form state from merchant data
  const [form, setForm] = useState({
    contactDetails: {
      whatsappNumber: merchant?.contactDetails?.whatsappNumber || '',
      telegramUsername: merchant?.contactDetails?.telegramUsername || '',
      supportEmail: merchant?.contactDetails?.supportEmail || '',
    },
    socialHandles: {
      instagramHandle: merchant?.socialHandles?.instagramHandle || '',
      facebookPageUrl: merchant?.socialHandles?.facebookPageUrl || '',
      twitterHandle: merchant?.socialHandles?.twitterHandle || '',
      tiktokHandle: merchant?.socialHandles?.tiktokHandle || '',
      linkedinUrl: merchant?.socialHandles?.linkedinUrl || '',
      youtubeChannelUrl: merchant?.socialHandles?.youtubeChannelUrl || '',
      pinterestUsername: merchant?.socialHandles?.pinterestUsername || '',
      threadsHandle: merchant?.socialHandles?.threadsHandle || '',
    },
  });

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);

    try {
      const { data } = await apiCall('put', '/merchants/social-settings', form);
      setMerchant(data.merchant);
      saveSession({ token: localStorage.getItem('luma_token'), merchant: data.merchant });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  }

  function updateContact(field, value) {
    setForm({
      ...form,
      contactDetails: { ...form.contactDetails, [field]: value },
    });
  }

  function updateHandle(field, value) {
    setForm({
      ...form,
      socialHandles: { ...form.socialHandles, [field]: value },
    });
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-bold text-black/50 hover:text-black">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>

      <header className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Settings</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Social Channels & Handles</h1>
        <p className="mt-3 max-w-2xl text-black/60">
          Manage your business contact details and social media profiles. These will be used when generating share
          links and directing customers to contact you.
        </p>
      </header>

      <form onSubmit={handleSave} className="max-w-4xl space-y-6">
        {/* Contact Details */}
        <SectionCard
          title="Contact & Direct Messaging"
          description="Primary channels for customer inquiries and support"
        >
          <SocialField
            label="WhatsApp Number"
            value={form.contactDetails.whatsappNumber}
            onChange={(v) => updateContact('whatsappNumber', v)}
            placeholder="+233 24 123 4567"
            icon={MessageCircle}
          />
          <SocialField
            label="Telegram Username"
            value={form.contactDetails.telegramUsername}
            onChange={(v) => updateContact('telegramUsername', v)}
            placeholder="@yourusername (without @)"
            icon={MessageSquare}
          />
          <SocialField
            label="Support Email"
            value={form.contactDetails.supportEmail}
            onChange={(v) => updateContact('supportEmail', v)}
            placeholder="support@yourstore.com"
            icon={MessageCircle}
          />
        </SectionCard>

        {/* Social Media Handles */}
        <SectionCard
          title="Social Media Profiles"
          description="Your business presence across platforms"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SocialField
              label="Instagram Handle"
              value={form.socialHandles.instagramHandle}
              onChange={(v) => updateHandle('instagramHandle', v)}
              placeholder="yourbusiness (without @)"
              icon={Instagram}
            />
            <SocialField
              label="Facebook Page URL"
              value={form.socialHandles.facebookPageUrl}
              onChange={(v) => updateHandle('facebookPageUrl', v)}
              placeholder="https://facebook.com/yourpage"
              icon={Facebook}
            />
            <SocialField
              label="Twitter / X Handle"
              value={form.socialHandles.twitterHandle}
              onChange={(v) => updateHandle('twitterHandle', v)}
              placeholder="yourbusiness (without @)"
              icon={Twitter}
            />
            <SocialField
              label="TikTok Handle"
              value={form.socialHandles.tiktokHandle}
              onChange={(v) => updateHandle('tiktokHandle', v)}
              placeholder="yourbusiness"
              icon={Play}
            />
            <SocialField
              label="LinkedIn URL"
              value={form.socialHandles.linkedinUrl}
              onChange={(v) => updateHandle('linkedinUrl', v)}
              placeholder="https://linkedin.com/company/yourpage"
              icon={Linkedin}
            />
            <SocialField
              label="YouTube Channel URL"
              value={form.socialHandles.youtubeChannelUrl}
              onChange={(v) => updateHandle('youtubeChannelUrl', v)}
              placeholder="https://youtube.com/c/yourchannel"
              icon={Youtube}
            />
            <SocialField
              label="Pinterest Username"
              value={form.socialHandles.pinterestUsername}
              onChange={(v) => updateHandle('pinterestUsername', v)}
              placeholder="yourusername"
              icon={Trash2}
            />
            <SocialField
              label="Threads Handle"
              value={form.socialHandles.threadsHandle}
              onChange={(v) => updateHandle('threadsHandle', v)}
              placeholder="yourbusiness (without @)"
              icon={X}
            />
          </div>
        </SectionCard>

        {/* Info Banner */}
        <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-200">
          <p className="text-sm font-bold text-emerald-900">💡 Tip:</p>
          <p className="mt-2 text-sm text-emerald-800">
            When you share products using the "Share as Ad" button, the generated links will pre-fill with your WhatsApp
            number and other social handles so customers can easily reach you or visit your profiles.
          </p>
        </div>

        {/* Error Message */}
        {error && <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600">{error}</div>}

        {/* Success Message */}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            <Check size={18} /> Settings saved successfully!
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-bold text-white disabled:opacity-60"
          >
            <Save size={18} />
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save all changes'}
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-black/10 px-6 py-3 font-bold text-black hover:bg-black/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </DashboardLayout>
  );
}
