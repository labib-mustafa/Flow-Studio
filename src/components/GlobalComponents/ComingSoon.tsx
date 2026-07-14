import React from 'react';
import customBanner from '../../assets/torn-paper-banner.png';
import paperBg from '../../assets/paper-texture-bg.jpg';

export const ComingSoon: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full flex items-center justify-center p-4 sm:p-8 overflow-hidden relative bg-white">
      {/* Paper Image Background Overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-multiply brightness-110 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${paperBg})` }}
      />

      {/* Soft Vignette / Lighting Overlay for depth */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(0,0,0,0.02)_100%)]" />

      <div className="relative w-full max-w-5xl overflow-hidden z-10 scale-80">

        <img
          src={customBanner}
          alt="Coming Soon"
          className="w-full h-auto block relative z-0 pointer-events-none"
        />

        {/* Text Overlay */}
        <div className="translate-x-[-15px] translate-y-[15px] absolute inset-0 flex items-center justify-center pl-[15%] pointer-events-none z-20">
          <span
            className="text-white font-bold leading-none tracking-wider text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)] select-none"
            style={{
              fontFamily: "'Rotunda-ExtraBold', 'Inter', sans-serif",
              fontSize: 'min(7vw, 90px)'
            }}
          >
            COMING SOON
          </span>
        </div>
      </div>
    </div>
  );
};
