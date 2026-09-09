import React, { useState, useEffect } from 'react';
import {
  Copy,
  Download,
  Share2,
  MessageCircle,
  Facebook,
  Linkedin,
  Mail,
  Zap,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import * as socialShare from '../lib/socialShare';
import { getToken } from '../lib/session';

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export default function ProductShareModal({ product, merchant, isOpen, onClose }) {
  const [tone, setTone] = useState('sales');
  const [platform, setPlatform] = useState('whatsapp');
  const [adCopy, setAdCopy] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shareCapabilities, setShareCapabilities] = useState({});
  const [selectedPlatforms, setSelectedPlatforms] = useState({});
  const [merchantInfo, setMerchantInfo] = useState(null);

  useEffect(() => {
    setShareCapabilities(socialShare.getShareCapabilities());
    // fetch merchant handles for building share links
    async function fetchMerchant() {
      try {
        const res = await fetch(`${apiBaseUrl}/merchants/me`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const json = await res.json();
          setMerchantInfo(json.merchant || null);
        }
      } catch (err) {
        console.warn('Failed to fetch merchant info for sharing');
      }
    }
    fetchMerchant();
  }, []);

  useEffect(() => {
    generateAd();
  }, [tone]);

  async function generateAd() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiBaseUrl}/ads/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          productId: product._id,
          platform: 'general',
          tone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ad');
      }

      const data = await response.json();
      setAdCopy(data.data.fullMessage);

      const ogImageUrl = `${apiBaseUrl}/og/product/${product._id}`;
      setImageUrl(ogImageUrl);
    } catch (err) {
      setError(err.message);
      console.error('Error generating ad:', err);
    } finally {
      setLoading(false);
    }
  }

  function togglePlatform(p) {
    setSelectedPlatforms((prev) => ({ ...prev, [p]: !prev[p] }));
  }

  function buildCheckoutLink() {
    const slug = merchant?.storeSlug || merchantInfo?.storeSlug || product.storeSlug || merchant?.slug;
    return `${window.location.origin}/store/${slug}/checkout/${product._id}`;
  }

  async function handleCopyText() {
    const checkoutLink = buildCheckoutLink();
    const result = await socialShare.copyToClipboard(adCopy, checkoutLink);
    setSuccess(result.message);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleDownloadImage() {
    const result = await socialShare.downloadImage(imageUrl, `${product.title}-share.png`);
    setSuccess(result.message);
    setTimeout(() => setSuccess(null), 3000);
  }

  function handleSharePlatform(platformId) {
    const checkoutLink = buildCheckoutLink();
    // Use merchant stored WhatsApp number if present
    const waNumber = merchant?.contactDetails?.whatsappNumber || merchantInfo?.contactDetails?.whatsappNumber || '';
    const personalizedCopy = adCopy;

    switch (platformId) {
      case 'whatsapp':
        socialShare.shareToWhatsApp(personalizedCopy, checkoutLink, waNumber);
        break;
      case 'facebook':
        socialShare.shareToFacebook(checkoutLink, personalizedCopy);
        break;
      case 'x':
        socialShare.shareToX(personalizedCopy, checkoutLink);
        break;
      case 'linkedin':
        socialShare.shareToLinkedIn(checkoutLink, product.title);
        break;
      case 'telegram':
        socialShare.shareToTelegram(personalizedCopy, checkoutLink);
        break;
      case 'threads':
        socialShare.shareToThreads(personalizedCopy, checkoutLink);
        break;
      case 'tiktok':
        socialShare.shareToTikTok(personalizedCopy, checkoutLink);
        break;
      case 'snapchat':
        socialShare.shareToSnapchat(personalizedCopy, checkoutLink);
        break;
      case 'instagram':
        if (shareCapabilities.nativeShare) {
          socialShare.nativeShare(product.title, personalizedCopy, checkoutLink, imageUrl);
        } else {
          setError('Native sharing not supported on this device');
        }
        break;
      case 'email':
        socialShare.shareViaEmail(`Check out: ${product.title}`, personalizedCopy, checkoutLink);
        break;
      default:
        break;
    }

    socialShare.trackShare(product._id, platformId);
  }

  async function handlePostAll() {
    try {
      setLoading(true);
      const enabledPlatforms = Object.keys(selectedPlatforms).filter((p) => selectedPlatforms[p]);
      if (enabledPlatforms.length === 0) {
        setError('Please select at least one platform');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/social/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ productId: product._id, platforms: enabledPlatforms, tone }),
      });

      if (!response.ok) throw new Error('Failed to post to social media');

      setSuccess(`Posted to ${enabledPlatforms.length} platform(s)!`);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message);
      console.error('Error posting to social media:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">✨ Create & Share Ad</h2>
            <p className="text-emerald-100 text-sm mt-1">{product.title}</p>
          </div>
          <button onClick={onClose} className="text-2xl hover:bg-white/20 p-2 rounded-lg transition">✕</button>
        </div>

        <div className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3 items-start">
              <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-emerald-700">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4">Choose Tone</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: 'sales', label: '🛍️ Sales Booster', desc: 'Urgent, exclusive deals' },
                    { value: 'trendy', label: '✨ Trendy/Gen-Z', desc: 'Hot, must-have vibes' },
                    { value: 'urgent', label: '⏰ Limited Offer', desc: 'FOMO, ending soon' },
                    { value: 'casual', label: '😊 Casual', desc: 'Informative, friendly' },
                  ].map((t) => (
                    <button key={t.value} onClick={() => setTone(t.value)} className={`p-4 rounded-xl border-2 transition text-left ${tone === t.value ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'}`}>
                      <div className="font-bold text-sm">{t.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">Preview</h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[300px] whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {loading ? (
                    <div className="flex items-center justify-center h-full gap-2">
                      <Loader size={20} className="animate-spin" />
                      <span>Generating ad...</span>
                    </div>
                  ) : (
                    adCopy || 'Loading preview...'
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={handleCopyText} disabled={loading} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
                    <Copy size={18} /> Copy Text
                  </button>
                  <button onClick={handleDownloadImage} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium">
                    <Download size={18} /> Download Image
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-3">Social Card Preview</h3>
                <div className="bg-gray-200 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  {loading ? (
                    <Loader size={24} className="animate-spin text-gray-600" />
                  ) : imageUrl ? (
                    <img src={imageUrl} alt="OG Preview" className="w-full h-full object-cover" onError={() => console.warn('Failed to load OG image')} />
                  ) : (
                    <span className="text-gray-500">Image preview</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">Share To</h3>
                <div className="space-y-2">
                  {[
                    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
                    { id: 'facebook', name: 'Facebook', icon: Facebook, color: '#1877F2' },
                    { id: 'x', name: 'X (Twitter)', icon: X, color: '#000000' },
                    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
                    { id: 'instagram', name: 'Instagram', icon: Share2, color: '#E4405F' },
                    { id: 'telegram', name: 'Telegram', icon: MessageCircle, color: '#229ED9' },
                    { id: 'threads', name: 'Threads', icon: Share2, color: '#111827' },
                    { id: 'tiktok', name: 'TikTok', icon: Share2, color: '#111827' },
                    { id: 'snapchat', name: 'Snapchat', icon: Share2, color: '#CA8A04' },
                    { id: 'email', name: 'Email', icon: Mail, color: '#EA4335' },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button key={p.id} onClick={() => handleSharePlatform(p.id)} className="w-full p-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-3 transition font-medium text-sm">
                        <Icon size={18} style={{ color: p.color }} />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3">Connected Accounts</h3>
                <div className="space-y-2">
                  {['facebook', 'instagram'].map((platform) => (
                    <label key={platform} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selectedPlatforms[platform] || false} onChange={() => togglePlatform(platform)} className="rounded" />
                      <span className="capitalize font-medium text-sm">{platform}</span>
                    </label>
                  ))}
                </div>

                {Object.values(selectedPlatforms).some((v) => v) && (
                  <button onClick={handlePostAll} disabled={loading} className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 font-bold">
                    <Zap size={18} /> Post to All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
