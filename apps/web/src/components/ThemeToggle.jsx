import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider.jsx';

export default function ThemeToggle({ compact = false }) {
  const { preference, theme, setPreference } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const Icon = theme === 'dark' ? Sun : Moon;
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return <button type="button" onClick={() => setPreference(nextTheme)} className={`theme-toggle theme-toggle-single ${compact ? 'theme-toggle-compact' : ''}`} aria-label={label} title={label}><Icon size={compact ? 15 : 17} /><span className="sr-only">{label}</span></button>;
}
