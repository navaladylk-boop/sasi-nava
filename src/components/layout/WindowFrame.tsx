import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Globe,
  User,
  Clock,
  Minimize2,
  Maximize2,
  X,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { Language, UserRole } from '../../types';
import { translations } from '../../i18n/translations';

interface WindowFrameProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  currentUserRole: UserRole;
  onUserRoleChange: (role: UserRole) => void;
  companyName: string;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  currentLanguage,
  onLanguageChange,
  currentUserRole,
  onUserRoleChange,
  companyName,
  children
}) => {
  const t = translations[currentLanguage];
  const [timeStr, setTimeStr] = useState<string>('');
  const [isMaximized, setIsMaximized] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) +
          ' ' +
          now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f0f2f5] text-[#333333] select-none overflow-hidden font-sans">
      {/* Professional Polish Windows Desktop Header */}
      <header
        id="window-title-bar"
        className="no-print h-14 bg-[#005a9e] text-white flex items-center justify-between px-6 shadow-md shrink-0 select-none"
      >
        {/* Left: App Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg text-white shadow-sm">
            L
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-white">
              {t.appTitle}
            </h1>
            <span className="text-[10px] bg-white/15 text-blue-100 border border-white/20 px-2 py-0.5 rounded font-mono font-medium">
              v1.2 Win-Desktop
            </span>
          </div>
          <div className="h-5 w-[1px] bg-white/25 mx-1"></div>
          <span className="text-blue-100 text-xs truncate max-w-[280px] flex items-center gap-1.5 opacity-90">
            <Building2 className="w-3.5 h-3.5 text-blue-200" />
            {companyName}
          </span>
        </div>

        {/* Center: System Status & Clock */}
        <div className="hidden md:flex items-center gap-4 text-blue-100">
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-xs border border-white/15 px-3 py-1 rounded-md text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span className="tracking-wide">{timeStr}</span>
          </div>
        </div>

        {/* Right: Language Selector, User Role Badge & Windows Controls */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex bg-black/20 rounded-lg p-1 text-xs font-medium border border-white/15">
            <button
              id="lang-en-btn"
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 rounded transition text-xs ${
                currentLanguage === 'en'
                  ? 'bg-white text-[#005a9e] rounded shadow-sm font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              English
            </button>
            <button
              id="lang-si-btn"
              onClick={() => onLanguageChange('si')}
              className={`px-3 py-1 rounded transition text-xs ${
                currentLanguage === 'si'
                  ? 'bg-white text-[#005a9e] rounded shadow-sm font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              සිංහල
            </button>
            <button
              id="lang-ta-btn"
              onClick={() => onLanguageChange('ta')}
              className={`px-3 py-1 rounded transition text-xs ${
                currentLanguage === 'ta'
                  ? 'bg-white text-[#005a9e] rounded shadow-sm font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              தமிழ்
            </button>
          </div>

          <div className="h-6 w-[1px] bg-white/20 hidden sm:block"></div>

          {/* User Role Badge */}
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] opacity-80 uppercase leading-none font-medium text-blue-100">Current User</span>
            <div className="flex items-center gap-1 text-sm font-medium text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 inline" />
              <span>{currentUserRole}</span>
            </div>
          </div>

          {/* Window control buttons */}
          <div className="flex items-center ml-1 border-l border-white/20 pl-2">
            <button
              id="win-min-btn"
              title="Minimize"
              className="p-1.5 hover:bg-white/15 text-blue-100 hover:text-white rounded transition"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="win-max-btn"
              title={isMaximized ? 'Restore' : 'Maximize'}
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 hover:bg-white/15 text-blue-100 hover:text-white rounded transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="win-close-btn"
              title="Exit Application"
              className="p-1.5 hover:bg-red-600 text-blue-100 hover:text-white rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <div className="flex-1 flex overflow-hidden">{children}</div>

      {/* Professional Polish Desktop Status Footer */}
      <footer className="no-print h-8 bg-white border-t border-[#d1d5db] flex items-center justify-between px-6 shrink-0 select-none text-[11px] font-medium text-[#6b7280]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            Database: <span className="text-emerald-700 font-bold uppercase flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Online (Local)</span>
          </span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1.5">
            Biometric Terminal: <span className="text-[#005a9e] font-semibold">ZKTeco K40 & Hikvision (Ready)</span>
          </span>
        </div>
        <div className="text-[11px] text-[#9ca3af] font-normal">
          License: Permanent (Single User) | Sri Lanka Localized Labour Standard v1.2.0-stable
        </div>
      </footer>
    </div>
  );
};
