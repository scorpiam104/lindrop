const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createHash, randomBytes, randomUUID } = require('crypto');
const Merchant = require('../models/Merchant');
const User = require('../models/User');

function hashToken(value) { return createHash('sha256').update(value).digest('hex'); }

async function sendRecoveryEmail({ email, resetLink }) {
  const subject = 'Reset your LinkPay password';
  const html = `<p>We received a request to reset your LinkPay password.</p><p><a href="${resetLink}">Reset your password</a></p><p>This link expires in one hour.</p>`;
  if (process.env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.MAIL_FROM || 'LinkPay <onboarding@resend.dev>', to: [email], subject, html }) });
    if (!response.ok) throw new Error('Resend rejected the recovery email.');
    return;
  }
  if (process.env.SMTP_HOST) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined });
    await transporter.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: email, subject, html });
    return;
  }
  if (process.env.NODE_ENV !== 'production') console.warn(`Password reset link for ${email}: ${resetLink}`);
}

function createToken(merchant) {
  return jwt.sign({ merchantId: merchant._id.toString(), role: merchant.role }, process.env.JWT_SECRET || 'development-secret', { expiresIn: '7d' });
}

function publicMerchant(merchant) {
  return {
    id: merchant._id,
    email: merchant.email,
    businessName: merchant.businessName || `${merchant.firstName || ''} ${merchant.surname || ''}`.trim() || 'LinkPay user',
    firstName: merchant.firstName || '',
    surname: merchant.surname || '',
    dateOfBirth: merchant.dateOfBirth || '',
    gender: merchant.gender || '',
    phone: merchant.phone || '',
    logoUrl: merchant.logoUrl,
    slug: merchant.slug || '',
    paystackPublicKey: merchant.paystackPublicKey,
    role: merchant.role,
    isVerified: merchant.isVerified
  };
}

function buildSlug(baseName, fallback) {
  const value = String(baseName || fallback || 'store').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback || 'store';
  return value;
}

function getRedirectBase() {
  return (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function getApiOrigin() {
  const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api$/, '').replace(/\/$/, '');
}

function getProviderConfig(provider) {
  const providerKey = String(provider || '').toLowerCase();
  const configs = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo'
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user'
    },
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/v19.0/me'
    }
  };

  return configs[providerKey] || null;
}

function buildOAuthAuthorizeUrl(provider, state) {
  const config = getProviderConfig(provider);
  if (!config || !config.clientId) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${getApiOrigin()}/api/auth/oauth/${provider}/callback`,
    response_type: 'code',
    scope: provider === 'google' ? 'openid email profile' : provider === 'github' ? 'user:email read:user' : 'email public_profile',
    state: state || randomUUID()
  });

  if (provider === 'facebook') {
    params.set('auth_type', 'rerequest');
  }

  return `${config.authUrl}?${params.toString()}`;
}

async function exchangeCodeForToken(provider, code) {
  const config = getProviderConfig(provider);
  if (!config || !config.clientId || !config.clientSecret) return null;

  const redirectUri = `${getApiOrigin()}/api/auth/oauth/${provider}/callback`;
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString()
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Unable to exchange OAuth code for ${provider}: ${message}`);
  }

  return response.json();
}

async function fetchOAuthUserInfo(provider, accessToken) {
  const config = getProviderConfig(provider);
  if (!config) return null;

  if (provider === 'google') {
    const response = await fetch(config.userInfoUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error('Unable to load Google profile info.');
    return response.json();
  }

  if (provider === 'github') {
    const userResponse = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!userResponse.ok) throw new Error('Unable to load GitHub profile info.');
    const user = await userResponse.json();
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = Array.isArray(emails) ? emails.find((entry) => entry.primary && entry.verified)?.email : null;
      if (primaryEmail) user.email = primaryEmail;
    }

    return user;
  }

  if (provider === 'facebook') {
    const url = new URL(config.userInfoUrl);
    url.searchParams.set('fields', 'id,name,email,picture');
    url.searchParams.set('access_token', accessToken);
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error('Unable to load Facebook profile info.');
    return response.json();
  }

  return null;
}

async function findOrCreateOauthMerchant(provider, profile) {
  const email = String(profile.email || `${provider}-${profile.id || profile.login || Date.now()}@oauth.lindrop.local`).toLowerCase();
  const firstName = String(profile.given_name || profile.name?.split(' ')[0] || `${provider} user`).trim();
  const surname = String(profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'User').trim();
  const businessName = `${firstName} ${surname}`.trim() || `${provider} Merchant`;
  let merchant = await Merchant.findOne({ email });

  if (!merchant) {
    const phone = '0240000000';
    const rawSlug = buildSlug(businessName, `${provider}-store-${Date.now()}`);
    let slug = rawSlug;
    let counter = 1;

    while (await Merchant.exists({ slug })) {
      slug = `${rawSlug}-${counter}`;
      counter += 1;
    }

    merchant = await Merchant.create({
      email,
      businessName,
      phone,
      firstName,
      surname,
      passwordHash: await bcrypt.hash(`${provider}-${profile.id || Date.now()}`, 12),
      logoUrl: profile.picture?.data?.url || profile.avatar_url || '',
      slug,
      isVerified: true
    });
  }

  return merchant;
}

async function redirectWithOAuthResult(req, res, provider, success, details) {
  const frontendUrl = getRedirectBase();
  const params = new URLSearchParams({
    oauth: success ? 'success' : 'error',
    provider
  });

  if (success && details) {
    params.set('token', details.token);
    params.set('merchant', JSON.stringify(details.merchant));
  }

  if (!success && details?.message) {
    params.set('message', details.message);
  }

  return res.redirect(`${frontendUrl}/login?${params.toString()}`);
}

async function oauthStart(req, res) {
  const provider = String(req.params.provider || '').toLowerCase();
  const config = getProviderConfig(provider);

  if (!config || !config.clientId) {
    return res.status(501).json({ message: `OAuth for ${provider} is not configured.` });
  }

  const authorizeUrl = buildOAuthAuthorizeUrl(provider, req.query.state || undefined);
  if (!authorizeUrl) {
    return res.status(400).json({ message: `Unsupported OAuth provider: ${provider}` });
  }

  return res.redirect(authorizeUrl);
}

async function oauthCallback(req, res) {
  const provider = String(req.params.provider || '').toLowerCase();
  const { code, error, error_description } = req.query;

  if (error) {
    return redirectWithOAuthResult(req, res, provider, false, { message: error_description || `OAuth sign-in was rejected by ${provider}.` });
  }

  if (!code) {
    return redirectWithOAuthResult(req, res, provider, false, { message: 'Missing OAuth authorization code.' });
  }

  try {
    const tokenPayload = await exchangeCodeForToken(provider, String(code));
    const accessToken = tokenPayload?.access_token || tokenPayload?.token;
    if (!accessToken) throw new Error('No access token was returned by the OAuth provider.');

    const profile = await fetchOAuthUserInfo(provider, accessToken);
    const merchant = await findOrCreateOauthMerchant(provider, profile);
    const token = createToken(merchant);

    return redirectWithOAuthResult(req, res, provider, true, {
      token,
      merchant: publicMerchant(merchant)
    });
  } catch (error) {
    console.error(`OAuth callback failed for ${provider}:`, error.message);
    return redirectWithOAuthResult(req, res, provider, false, { message: `Unable to finish ${provider} sign-in. Please try again.` });
  }
}

async function register(req, res) {
  const { email, password, confirmPassword, firstName, surname, dateOfBirth, gender, phoneNumber } = req.body;
  if (!email || !password || !firstName || !surname || !dateOfBirth || !gender) {
    return res.status(400).json({ message: 'First name, surname, date of birth, gender, email, and password are required.' });
  }
  if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  if (confirmPassword && password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });

  const normalizedName = `${String(firstName).trim()} ${String(surname).trim()}`.trim();
  const businessName = normalizedName || 'LinkPay user';
  const slug = buildSlug(businessName, `user-${Date.now()}`);

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const merchant = await Merchant.create({
      email,
      passwordHash,
      businessName,
      phone: String(phoneNumber || '').trim(),
      firstName: String(firstName).trim(),
      surname: String(surname).trim(),
      dateOfBirth: String(dateOfBirth).trim(),
      gender: String(gender).trim(),
      slug
    });
    return res.status(201).json({ token: createToken(merchant), merchant: publicMerchant(merchant) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That email or profile URL is already in use.' });
    console.error('Merchant registration failed:', error.message);
    return res.status(500).json({ message: 'Unable to create merchant account.' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  const merchant = await Merchant.findOne({ email: String(email || '').toLowerCase() });
  if (!merchant || !(await bcrypt.compare(password || '', merchant.passwordHash))) return res.status(401).json({ message: 'Invalid email or password.' });
  return res.json({ token: createToken(merchant), merchant: publicMerchant(merchant) });
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  const account = await Merchant.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires') || await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
  if (account) {
    const rawToken = randomBytes(32).toString('hex');
    account.resetPasswordToken = hashToken(rawToken);
    account.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await account.save();
    const resetLink = `${getRedirectBase()}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    await sendRecoveryEmail({ email, resetLink });
  }
  return res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
}

async function resetPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (!email || !token || password.length < 8) return res.status(400).json({ message: 'Email, token, and a password of at least 8 characters are required.' });
  const query = { email, resetPasswordToken: hashToken(token), resetPasswordExpires: { $gt: new Date() } };
  const account = await Merchant.findOne(query).select('+passwordHash +resetPasswordToken +resetPasswordExpires') || await User.findOne(query).select('+passwordHash +resetPasswordToken +resetPasswordExpires');
  if (!account) return res.status(400).json({ message: 'The reset token is invalid or expired.' });
  account.passwordHash = await bcrypt.hash(password, 12);
  account.resetPasswordToken = null;
  account.resetPasswordExpires = null;
  await account.save();
  return res.json({ message: 'Password reset successfully. You can now sign in.' });
}

function createBackupCode() { return randomBytes(5).toString('hex').toUpperCase(); }

async function generateTwoFactorBackupCodes(req, res) {
  const user = await User.findOne({ $or: [{ merchantId: req.merchant._id }, { email: req.merchant.email }] }).select('+twoFactorBackupCodes');
  if (!user) return res.status(404).json({ message: 'User security profile not found.' });
  const codes = Array.from({ length: 8 }, createBackupCode);
  user.twoFactorBackupCodes = await Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
  await user.save();
  return res.json({ message: 'Store these recovery codes securely. Each code works once.', codes });
}

async function verifyTwoFactorRecovery(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const code = String(req.body.code || '').trim().toUpperCase();
  const user = await User.findOne({ email }).select('+twoFactorBackupCodes');
  if (!user || !user.twoFactorBackupCodes?.length) return res.status(401).json({ message: 'Invalid recovery code.' });
  const index = await Promise.all(user.twoFactorBackupCodes.map((hash) => bcrypt.compare(code, hash))).then((matches) => matches.findIndex(Boolean));
  if (index < 0) return res.status(401).json({ message: 'Invalid recovery code.' });
  user.twoFactorBackupCodes.splice(index, 1);
  await user.save();
  return res.json({ message: 'Recovery code accepted. Complete sign-in again to continue.' });
}

module.exports = { login, register, oauthStart, oauthCallback, forgotPassword, resetPassword, generateTwoFactorBackupCodes, verifyTwoFactorRecovery };
