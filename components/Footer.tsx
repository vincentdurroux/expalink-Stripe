import React from 'react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  const linkClass = "text-sm font-semibold text-gray-400 hover:text-[#2e75c2] transition-all hover:scale-105 text-center inline-block";
  const titleClass = "text-[11px] font-black uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-[#45a081] to-[#2e75c2] pb-4 border-b border-gray-100/50 w-fit mx-auto";

  return (
    <footer className="bg-white border-t border-gray-100/80">
      <div className="max-w-7xl mx-auto px-8 py-20 md:py-28">
        {/* Fat Footer Content - Centered Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-12 mb-20 md:mb-28">
          
          {/* Column 1: Platform */}
          <div className="flex flex-col items-center gap-8">
            <h4 className={titleClass}>{t('footer.platform')}</h4>
            <ul className="flex flex-col items-center gap-5">
              <li><button className={linkClass}>{t('nav.findPro')}</button></li>
              <li><button className={linkClass}>{t('nav.howItWorks')}</button></li>
            </ul>
          </div>

          {/* Column 2: Support */}
          <div className="flex flex-col items-center gap-8">
            <h4 className={titleClass}>{t('footer.support')}</h4>
            <ul className="flex flex-col items-center gap-5">
              <li><button className={linkClass}>{t('footer.faq')}</button></li>
              <li><button className={linkClass}>{t('admin.tabs.support')}</button></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="flex flex-col items-center gap-8">
            <h4 className={titleClass}>{t('footer.legal')}</h4>
            <ul className="flex flex-col items-center gap-5">
              <li><button className={linkClass}>{t('footer.terms')}</button></li>
              <li><button className={linkClass}>{t('footer.privacy')}</button></li>
              <li><button className={linkClass}>{t('footer.cookies')}</button></li>
            </ul>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="flex flex-col items-center pt-20">
          <div className="relative mb-10 group">
             <div className="absolute inset-0 bg-gradient-to-br from-[#45a081] to-[#2e75c2] rounded-full blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-1000"></div>
             <Logo className="w-11 h-11 opacity-20 grayscale brightness-125 group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-700" />
          </div>
          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300 px-4 text-center leading-relaxed">
            © 2026 ExpaLink Global Network. All Rights Reserved.
          </p>
          <div className="mt-6 flex items-center gap-6 opacity-20 grayscale contrast-125">
             <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;