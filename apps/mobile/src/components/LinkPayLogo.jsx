import { SvgXml } from 'react-native-svg';

const logoXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6D42F5"/><stop offset="55%" stop-color="#8D68FF"/><stop offset="100%" stop-color="#5EE7F4"/></linearGradient></defs><g transform="translate(20,25)"><rect x="20" y="45" width="70" height="60" rx="30" fill="none" stroke="url(#g)" stroke-width="16"/><rect x="65" y="45" width="70" height="60" rx="30" fill="none" stroke="#6D42F5" stroke-width="16" opacity=".9"/><path d="M45 110C70 110 100 80 120 40" fill="none" stroke="#5EE7F4" stroke-width="8" stroke-linecap="round"/></g><text x="180" y="115" font-family="Arial,sans-serif" font-size="64" font-weight="800" fill="#0B0820">Link</text><text x="305" y="115" font-family="Arial,sans-serif" font-size="64" fill="url(#g)">Pay</text><circle cx="422" cy="70" r="6" fill="#5EE7F4"/></svg>`;

export default function LinkPayLogo({ width = 150, height = 50 }) {
  return <SvgXml xml={logoXml} width={width} height={height} />;
}