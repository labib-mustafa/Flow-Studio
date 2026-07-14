import React, { useState, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLeadStore, Lead, ColumnLabels } from '../../stores/leadStore';
import { EditableHeaderCell } from './EditableHeaderCell';
import { InlineEditCell } from './InlineEditCell';
import {
  Facebook,
  Linkedin,
  Github,
  Youtube,
  Dribbble,
  Slack,
  Twitch,
  Gitlab,
  Figma,
  Instagram,
  Bell,
  RefreshCw
} from 'lucide-react';
import { EmptyState } from '../GlobalComponents/EmptyState';

const SocialIcon = React.memo(({ url }: { url: string }) => {
  const lowercaseUrl = url.toLowerCase();

  if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('facebook') || lowercaseUrl.includes('fb.com') || lowercaseUrl.includes('fb')) {
    return (
      <svg className="w-3.5 h-3.5 shrink-0 animate-fade-in" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#0866FF" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('messenger.com') || lowercaseUrl.includes('messenger')) {
    return (
      <svg className="w-3.5 h-3.5 shrink-0 animate-fade-in" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="messengerGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0099FF" />
            <stop offset="60%" stopColor="#A033FF" />
            <stop offset="100%" stopColor="#FF5280" />
          </linearGradient>
        </defs>
        <path d="M12 2C6.477 2 2 6.145 2 11.258c0 3.1 1.65 5.86 4.195 7.558V22l3.053-1.688A10.87 10.87 0 0012 20.516c5.523 0 10-4.145 10-9.258S17.523 2 12 2zm1.886 11.83l-2.617-2.793-5.111 2.793 5.62-5.962 2.673 2.793 5.055-2.793-5.62 5.962z" fill="url(#messengerGradient)" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('google.com/maps') || lowercaseUrl.includes('maps.google') || lowercaseUrl.includes('googlemaps') || lowercaseUrl.includes('google-maps') || lowercaseUrl.includes('/maps/') || lowercaseUrl.includes('google maps')) {
    return (
      <svg className="w-3.5 h-3.5 shrink-0 animate-fade-in" viewBox="0 0 24 24" fill="none">
        <path d="M19.5 9.5c0 4.88-6 11.5-7.5 13-1.5-1.5-7.5-8.12-7.5-13a7.5 7.5 0 1115 0z" fill="#EA4335" />
        <path d="M12 13a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" fill="#4285F4" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('linkedin.com') || lowercaseUrl.includes('linkedin')) {
    return <Linkedin className="w-3.5 h-3.5 text-[#0A66C2] shrink-0 animate-fade-in" />;
  }

  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('twitter') || lowercaseUrl.includes('x.com') || lowercaseUrl.includes('/x/')) {
    return (
      <svg className="w-3.5 h-3.5 text-zinc-900 shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('instagram.com') || lowercaseUrl.includes('instagram') || lowercaseUrl.includes('insta')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#E1306C] shrink-0 animate-fade-in" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('github.com') || lowercaseUrl.includes('github')) {
    return <Github className="w-3.5 h-3.5 text-[#24292F] shrink-0 animate-fade-in" />;
  }

  if (lowercaseUrl.includes('gitlab.com') || lowercaseUrl.includes('gitlab')) {
    return <Gitlab className="w-3.5 h-3.5 text-[#FC6D26] shrink-0 animate-fade-in" />;
  }

  if (lowercaseUrl.includes('figma.com') || lowercaseUrl.includes('figma')) {
    return <Figma className="w-3.5 h-3.5 text-[#F24E1E] shrink-0 animate-fade-in" />;
  }

  if (lowercaseUrl.includes('slack.com') || lowercaseUrl.includes('slack')) {
    return <Slack className="w-3.5 h-3.5 text-[#4A154B] shrink-0 animate-fade-in" />;
  }

  if (lowercaseUrl.includes('twitch.tv') || lowercaseUrl.includes('twitch')) {
    return <Twitch className="w-3.5 h-3.5 text-[#9146FF] shrink-0 animate-fade-in" />;
  }

  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtube') || lowercaseUrl.includes('youtu.be')) {
    return <Youtube className="w-3.5 h-3.5 text-[#FF0000] shrink-0 animate-fade-in" />;
  }

  if (lowercaseUrl.includes('dribbble.com') || lowercaseUrl.includes('dribbble')) {
    return <Dribbble className="w-3.5 h-3.5 text-[#EA4C89] shrink-0 animate-fade-in" />;
  }

  if (lowercaseUrl.includes('behance.net') || lowercaseUrl.includes('behance')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#1769FF] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4.654 3c.461 0 .887.035 1.278.14.39.07.711.216.996.391s.497.426.641.747c.14.32.216.711.216 1.137 0 .496-.106.922-.356 1.242-.215.32-.566.606-.997.817.606.176 1.067.496 1.348.922s.461.957.461 1.563c0 .496-.105.922-.285 1.278a2.3 2.3 0 0 1-.782.887c-.32.215-.711.39-1.137.496a5.3 5.3 0 0 1-1.278.176L0 12.803V3zm-.285 3.978c.39 0 .71-.105.957-.285.246-.18.355-.497.355-.887 0-.216-.035-.426-.105-.567a1 1 0 0 0-.32-.355 1.8 1.8 0 0 0-.461-.176c-.176-.035-.356-.035-.567-.035H2.17v2.31c0-.005 2.2-.005 2.2-.005zm.105 4.193c.215 0 .426-.035.606-.07.176-.035.356-.106.496-.216s.25-.215.356-.39c.07-.176.14-.391.14-.641 0-.496-.14-.852-.426-1.102-.285-.215-.676-.32-1.137-.32H2.17v2.734h2.305zm6.858-.035q.428.427 1.278.426c.39 0 .746-.106 1.032-.286q.426-.32.53-.64h1.74c-.286.851-.712 1.457-1.278 1.848-.566.355-1.243.566-2.06.566a4.1 4.1 0 0 1-1.527-.285 2.8 2.8 0 0 1-1.137-.782 2.85 2.85 0 0 1-.712-1.172c-.175-.461-.25-.957-.25-1.528 0-.531.07-1.032.25-1.493.18-.46.426-.852.747-1.207.32-.32.711-.606 1.137-.782a4 4 0 0 1 1.493-.285c.606 0 1.137.105 1.598.355.46.25.817.532 1.102.958.285.39.496.851.641 1.348.07.496.105.996.07 1.563h-5.15c0 .58.21 1.11.496 1.396m2.24-3.732c-.25-.25-.642-.391-1.103-.391-.32 0-.566.07-.781.176s-.356.25-.496.39a.96.96 0 0 0-.25.497c-.036.175-.07.32-.07.46h3.196c-.07-.526-.25-.882-.497-1.132zm-3.127-3.728h3.978v.957h-3.978z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('pinterest.com') || lowercaseUrl.includes('pinterest') || lowercaseUrl.includes('pin.it')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#BD081C] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.965 1.406-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.62 0 11.988-5.367 11.988-11.987C24.005 5.367 18.636 0 12.017 0z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('tiktok.com') || lowercaseUrl.includes('tiktok')) {
    return (
      <svg className="w-3.5 h-3.5 text-black shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.74-3.94-1.69-.22-.19-.42-.39-.62-.6v5.93c.02 1.87-.5 3.75-1.58 5.23-1.25 1.73-3.29 2.87-5.43 3.01-2.42.15-4.94-.78-6.42-2.73-1.62-2.11-1.99-5.1-1.02-7.51C4.46 9.4 6.77 7.74 9.38 7.68c.02 1.43 0 2.86.01 4.29-1.29.08-2.58.74-3.24 1.86-.77 1.3-.61 3.09.43 4.19 1.05 1.1 2.76 1.34 4.04.62 1.02-.57 1.6-1.7 1.59-2.88V0h.33z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('whatsapp.com') || lowercaseUrl.includes('whatsapp') || lowercaseUrl.includes('wa.me')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#25D366] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('telegram.org') || lowercaseUrl.includes('telegram') || lowercaseUrl.includes('t.me')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#26A5E4] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-1-.65-.35-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.04-.75 4.08-1.77 6.8-2.94 8.16-3.5 3.88-1.61 4.68-1.89 5.21-1.9.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.13-.03.18z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('snapchat.com') || lowercaseUrl.includes('snapchat')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#FFFC00] stroke-black stroke-[1.2px] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.417c-.777 0-2.316.096-3.14.542-.716.388-1.58.983-1.58 2.054 0 .285.07.618.232.993.18.423.473.74.836.902-.313.2-.619.467-.84.811-.219.34-.343.834-.236 1.411.085 1.054.912 1.637 2.08 1.782-.162.381-.225.807-.156 1.246.069.439.294.813.626 1.077-.282.355-.544.896-.757 1.528-.213.633-.362 1.238-.362 1.884 0 .692.3 1.237.893 1.528.58.286 1.343.387 2.193.387h1.428c.85 0 1.613-.1 2.193-.387.593-.291.893-.836.893-1.528 0-.646-.149-1.251-.362-1.884-.213-.632-.475-1.173-.757-1.528.332-.264.557-.638.626-1.077.069-.439.006-.865-.156-1.246 1.168-.145 1.995-.728 2.08-1.782.107-.577-.017-1.071-.236-1.411-.221-.344-.527-.611-.84-.811.363-.162.656-.479.836-.902.162-.375.232-.708.232-.993 0-1.071-.864-1.666-1.58-2.054-.824-.446-2.363-.542-3.14-.542zm0 18.257c-2.457 0-3.328-1.564-3.328-2.738 0-.584.288-1.084.71-1.408a.56.56 0 01.603.028c.677.498 1.488.75 2.015.75.524 0 1.335-.252 2.015-.75a.56.56 0 01.603-.028c.422.324.71.824.71 1.408 0 1.174-.871 2.738-3.328 2.738z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('reddit.com') || lowercaseUrl.includes('reddit')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#FF4500] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.29-1.72l1.35-4.24 3.71.79c.05.89.78 1.61 1.69 1.61 1.25 0 2.25-1 2.25-2.25S19.25 2 18 2c-1 0-1.84.65-2.15 1.54l-4.11-.87c-.24-.05-.48.09-.55.33l-1.6 5c-2.49.04-4.73.68-6.39 1.72C2.78 8.98 1.88 8.5 1 8.5c-1.65 0-3 1.35-3 3 0 1.11.6 2.08 1.5 2.59-.03.27-.05.54-.05.81 0 3.86 4.43 7 9.88 7 5.46 0 9.88-3.14 9.88-7 0-.27-.02-.54-.05-.81.9-.51 1.5-1.48 1.5-2.59zM6 13.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S8.33 15 7.5 15 6 14.17 6 13.5zm11.75 3.38c-.9 1-2.6 1.62-4.75 1.62s-3.85-.62-4.75-1.62c-.22-.24-.2-.61.04-.83.24-.22.61-.2.83.04.65.73 1.94 1.16 3.88 1.16s3.23-.43 3.88-1.16c.22-.24.59-.26.83-.04.24.22.26.59.04.83zm-1.25-1.88c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('discord.com') || lowercaseUrl.includes('discord.gg') || lowercaseUrl.includes('discord')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#5865F2] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 01-1.873-.894.077.077 0 01-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 01.077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 01.078.009c.12.099.246.195.373.289a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('medium.com') || lowercaseUrl.includes('medium')) {
    return (
      <svg className="w-3.5 h-3.5 text-black shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('producthunt.com') || lowercaseUrl.includes('producthunt')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#DA552F] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 12.5H9.5V9.5H13c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('stackoverflow.com') || lowercaseUrl.includes('stackoverflow')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#F48024] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.986 21.865v-6.404h2.24v8.644H1.142v-8.644h2.24v6.404H18.99zM6.11 15.03l10.374 2.145.458-2.19-10.374-2.147-.458 2.192zm1.614-4.838l9.467 4.604.996-2.01-9.467-4.602-.996 2.008zm2.846-4.264l7.633 7.152 1.488-1.684-7.633-7.15-1.488 1.682zm4.143-3.08l5.143 9.176 1.95-1.09-5.143-9.178-1.95 1.092zM15.426 0l-1.9 1.1 5.1 9.2 1.9-1.1L15.43 0z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('threads.net') || lowercaseUrl.includes('threads')) {
    return (
      <svg className="w-3.5 h-3.5 text-black shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.553 16.924c-1.834 0-3.322-1.398-3.322-3.282s1.488-3.282 3.322-3.282c1.782 0 3.23 1.34 3.315 3.125h2.015c-.09-2.92-2.52-5.125-5.33-5.125-3.08 0-5.33 2.373-5.33 5.282s2.25 5.282 5.33 5.282c2.062 0 3.864-1.157 4.706-2.883l-1.764-1.02c-.52 1.077-1.576 1.623-2.942 1.623z" />
        <path d="M12.553 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.41-8c-.085-1.785-1.533-3.125-3.315-3.125-1.834 0-3.322 1.398-3.322 3.282s1.488 3.282 3.322 3.282c1.366 0 2.422-.546 2.942-1.623l1.764 1.02c-.842 1.726-2.644 2.883-4.706 2.883-3.08 0-5.33-2.373-5.33-5.282s2.25-5.282 5.33-5.282c2.81 0 5.24 2.205 5.33 5.125h-2.015z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('mastodon.social') || lowercaseUrl.includes('mastodon')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#6364FF] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-4.96C14.99.03 12 .03 12 .03s-2.99 0-5.964.323c-2.687.35-4.954 2.382-5.304 4.96C.392 7.76.35 11.455.35 11.455s.042 3.693.382 6.143c.35 2.578 2.617 4.61 5.304 4.96 2.974.322 5.964.322 5.964.322s2.99 0 5.964-.322c2.687-.35 4.954-2.382 5.304-4.96.34-2.45.382-6.143.382-6.143s-.042-3.693-.382-6.143zM12 16.89c-2.535 0-4.22-1.39-4.22-1.39v.08c0 1.96 1.58 3.51 3.52 3.55 1.95.04 3.63-1.07 3.63-1.07l.03 1c-2.12.82-5.27.47-6.38-.85C7.24 16.66 7.13 14 7.13 14s0-2.32.13-3.66c.21-2.14 1.83-3.4 3.74-3.46 1.9-.06 3.66 1 3.66 1s.09-2.33-.14-3.68c-.2-1.2-.95-1.9-2.12-2.14-.95-.19-2.32-.19-2.32-.19s2.53.04 4.22 1.39c0 0-1.68-1.39-4.22-1.39z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('wechat.com') || lowercaseUrl.includes('wechat')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#09BB07] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.56 12.01c-.42 0-.75-.33-.75-.75s.33-.75.75-.75c.41 0 .75.33.75.75s-.34.75-.75.75zm3.76 0c-.41 0-.75-.33-.75-.75s.34-.75.75-.75c.42 0 .75.33.75.75s-.33.75-.75.75zm5.66-2.26c-.34-.14-.72-.22-1.12-.22-.39 0-.77.08-1.11.22l-.12-.03-.23.11c.21.32.32.7.32 1.09v.08c0 .24-.04.48-.12.7l-.05.15.17.15c.67.62 1.62.99 2.65.99.39 0 .77-.05 1.13-.15l.13-.03.22.1c.32.15.71.27 1.11.37l.08.02-.02-.08c-.1-.4-.22-.79-.37-1.12l-.04-.1.03-.13c.1-.36.16-.74.16-1.13 0-1.8-1.74-3.26-3.89-3.26zm2.46-.75c-.32 0-.64.04-.94.12.75.56 1.24 1.39 1.24 2.33 0 .49-.13.95-.36 1.35.88-.13 1.65-.63 2.12-1.33.15.34.28.73.38 1.13l.02.08.08-.02c.4-.1.79-.22 1.11-.37l.22-.1.13.03c.36.1.74.15 1.13.15 1.03 0 1.98-.37 2.65-.99l.17-.15-.05-.15c-.08-.22-.12-.46-.12-.7v-.08c0-.39.11-.77.32-1.09l-.23-.11-.12.03c-.34-.14-.72-.22-1.11-.22-.4 0-.78.08-1.12.22-2.15 0-3.89-1.46-3.89-3.26 0-.39.06-.77.16-1.13l.03-.13-.04-.1c-.15-.33-.27-.72-.37-1.12l-.02-.08-.08.02c-.4.1-.79.22-1.11.37l-.22.1-.13-.03c-.36-.1-.74-.15-1.13-.15-2.15 0-3.89 1.46-3.89 3.26v.08c0 .39.11.77.32 1.09z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('weibo.com') || lowercaseUrl.includes('weibo')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#E6162D] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10.05 18.06c-3.9 0-7.07-1.92-7.07-4.29 0-2.31 3.01-4.21 6.72-4.29.35-.01.71 0 1.06.03.35.03.7.07 1.04.14-1.08.82-1.49 1.94-.96 2.65.43.58 1.48.51 2.34-.15.42-.32.74-.75.94-1.22a7.35 7.35 0 011.66 2.82c.1 1.25-1.49 4.31-5.73 4.31zm5.82-9.42c-.52-.39-1.19-.52-1.84-.36-.65.16-1.18.6-1.47 1.18l-.05.11c-.4.86-.1 1.9.68 2.41.4.26.88.36 1.36.29.13.43.34.82.63 1.15.54.62 1.34.98 2.21.98.63 0 1.25-.19 1.76-.56a5.55 5.55 0 001.37-1.84c.3-.68.39-1.44.25-2.18-.15-.79-.57-1.5-1.2-2.02-.63-.52-1.42-.77-2.22-.71a3.42 3.42 0 00-1.48.56zm4.99-2.73a9.7 9.7 0 00-4.04-1.63 9.6 9.6 0 00-4.29.21l.13.44a9.12 9.12 0 013.92-.19c1.3.26 2.49.9 3.41 1.83.92.93 1.54 2.12 1.77 3.42l.44-.13a9.55 9.55 0 00-.34-3.95zm-2.02.7c-.52-.39-1.19-.52-1.84-.36a2.12 2.12 0 00-1.47 1.18c-.4.86-.1 1.9.68 2.41.4.26.88.36 1.36.29a3.64 3.64 0 012.84-2.93c.15-.43.15-.9.01-1.34a2.76 2.76 0 00-1.58-1.25z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('tumblr.com') || lowercaseUrl.includes('tumblr')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#35465C] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3.5 17.5h-2c-1.381 0-2.5-1.119-2.5-2.5v-5.5h-1.5v-2h1.5v-2h2v2h2.5v2h-2.5v5.5c0 .276.224.5.5.5h2v2z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('quora.com') || lowercaseUrl.includes('quora')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#B92B27] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.486 2 2 6.486 2 12c0 2.463.896 4.717 2.378 6.46l-.378 1.512c-.053.212.16.395.361.312l1.716-.708C7.689 20.73 9.774 21 12 21c5.514 0 10-4.486 10-10S17.514 2 12 2zm3.627 12.373a3.545 3.545 0 01-1.354 1.157l1.036 1.813c.092.16-.023.36-.208.36h-.854c-.114 0-.218-.06-.27-.16l-.886-1.55a4.34 4.34 0 01-1.464.257c-2.4 0-4.35-1.95-4.35-4.35s1.95-4.35 4.35-4.35 4.35 1.95 4.35 4.35c0 1.035-.362 1.983-.969 2.738l-.027-.375v.068zm-3.627-1.15c.966 0 1.75-.784 1.75-1.75s-.784-1.75-1.75-1.75-1.75.784-1.75 1.75.784 1.75 1.75 1.75z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('calendly.com') || lowercaseUrl.includes('calendly')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#006BFF] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21.241 4.542h-2.759v-1.92h-1.92v1.92h-9.124v-1.92h-1.92v1.92H2.76A2.76 2.76 0 000 7.302v13.938A2.76 2.76 0 002.759 24h18.482A2.76 2.76 0 0024 21.24V7.301a2.76 2.76 0 00-2.759-2.759zM22.08 21.24a.84.84 0 01-.84.84H2.76a.84.84 0 01-.84-.84V11.26h20.16v9.98zm0-11.901H1.92v-2.04c0-.46.38-.84.84-.84h2.758v1.92h1.92v-1.92h9.124v1.92h1.92v-1.92h2.759c.46 0 .84.38.84.84v2.04z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('vimeo.com') || lowercaseUrl.includes('vimeo')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#1AB7EA] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.396 7.164c-.093 2.026-1.507 4.8-4.245 8.32C15.323 19.161 12.93 21 11 21c-1.314 0-2.437-1.127-3.36-3.361-.604-2.125-1.218-4.521-1.745-5.918-.737-1.979-1.579-2.969-2.527-2.969-.168 0-.829.356-1.983 1.07l-1.23-1.53c1.233-1.026 2.457-2.148 3.655-3.32C5.556 3.23 6.84 2.585 7.674 2.585c1.841 0 2.905 1.258 3.192 3.774.24 2.152.484 3.498.718 4.027.535 1.488 1.139 2.23 1.8 2.23.518 0 1.216-.628 2.083-1.899.882-1.294 1.348-2.317 1.385-3.087.062-1.246-.43-1.868-1.463-1.868-.535 0-1.127.126-1.765.378 1.144-3.585 3.324-5.26 6.541-5.045 2.154.148 3.239 1.383 3.264 3.702z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('upwork.com') || lowercaseUrl.includes('upwork')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#14A800] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.57 3.32a3.86 3.86 0 00-3.86 3.86v3.29h-.03a5.57 5.57 0 00-4.04-1.74A5.57 5.57 0 005.1 14.28a5.57 5.57 0 005.57 5.57 5.57 5.57 0 005.57-5.57v-3.29h.03a3.86 3.86 0 003.86-3.86 3.86 3.86 0 00-3.86-3.86zm-5.71 11.16a3.29 3.29 0 11-6.57 0 3.29 3.29 0 016.57 0z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('fiverr.com') || lowercaseUrl.includes('fiverr')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#1DBF73] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm3 16.5h-2v-4.5h-1.5v-1.5h1.5v-1c0-1.8 1.1-2.5 2.5-2.5h1.5v2h-1c-.5 0-.5.2-.5.5v1h1.5v1.5h-1.5v4.5z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('freelancer.com') || lowercaseUrl.includes('freelancer')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#007FED] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0L2.4 4.8v6.4c0 6 4.1 11.6 9.6 12.8 5.5-1.2 9.6-6.8 9.6-12.8V4.8L12 0zm2.4 14.4h-4.8v-1.6h4.8v1.6zm0-3.2h-4.8V9.6h4.8v1.6z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('clutch.co') || lowercaseUrl.includes('clutch')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#E2384A] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11h-3v3h-2v-3H8v-2h3V8h2v3h3v2z" />
      </svg>
    );
  }

  if (lowercaseUrl.includes('yelp.com') || lowercaseUrl.includes('yelp')) {
    return (
      <svg className="w-3.5 h-3.5 text-[#D32323] shrink-0 animate-fade-in" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 16.5c-1.381 0-2.5-1.119-2.5-2.5v-5.5h-1.5v-2h1.5v-2h2v2h2.5v2h-2.5v5.5c0 .276.224.5.5.5h2v2z" />
      </svg>
    );
  }

  return (
    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
});

const SOCIAL_REGEX = /facebook|fb\.com|linkedin|twitter|x\.com|instagram|insta|github|gitlab|figma|slack|twitch|youtube|youtu\.be|dribbble|behance|pinterest|pin\.it|tiktok|whatsapp|wa\.me|telegram|t\.me|snapchat|reddit|discord|medium|producthunt|stackoverflow|threads|mastodon|wechat|weibo|tumblr|quora|calendly|vimeo|messenger|upwork|fiverr|freelancer|clutch|yelp|google\.com\/maps|maps\.google|\/maps\//i;

export const isSocialLink = (val: any): boolean => {
  if (!val || typeof val !== 'string') return false;
  return SOCIAL_REGEX.test(val);
};

interface LeadTableProps {
  zoom?: number;
  onZoomChange?: (newZoom: number) => void;
  onMailClick?: (leadId: string) => void;
}

const ResizableHeader: React.FC<{
  id: string;
  field?: keyof ColumnLabels;
  label: string;
  align?: 'left' | 'right' | 'center';
  isEditable?: boolean;
  sortConfig?: { column: string; direction: 'asc' | 'desc' } | null;
  onContextMenu?: (e: React.MouseEvent) => void;
  zoom?: number;
  forceEdit?: boolean;
  onEditComplete?: () => void;
  onSort?: (colId: string) => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}> = ({
  id, field, label, align = 'left', isEditable = true, sortConfig, onSort, onContextMenu, zoom = 1.0, forceEdit = false, onEditComplete,
  draggable = false, isDragging = false, isDragOver = false, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd
}) => {
    const { columns, updateColumn, updateColumnLabel } = useLeadStore();
    const width = columns?.find(c => c.id === id)?.width || 150;

    const startResize = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.pageX;
      const startWidth = width;

      const thElement = (e.target as HTMLElement).closest('th');
      const tableElement = (e.target as HTMLElement).closest('table');
      const colElement = document.getElementById(`col-width-${id}`);

      // Calculate the exact sum of all OTHER columns
      const otherColumnsTotalWidth = 32 + 40 + (columns || [])
        .filter(c => c.id !== id)
        .reduce((acc, col) => acc + (col.width || 150), 0);

      document.body.classList.add('resizing-column');

      const onMouseMove = (moveEvent: MouseEvent) => {
        let deltaX = (moveEvent.pageX - startX) / zoom;
        let newWidth = startWidth + deltaX;
        if (newWidth < 60) newWidth = 60;
        if (newWidth > 800) newWidth = 800;

        if (colElement) {
          colElement.style.width = `${newWidth}px`;
        }
        if (thElement) {
          thElement.style.width = `${newWidth}px`;
          thElement.style.minWidth = `${newWidth}px`;
          thElement.style.maxWidth = `${newWidth}px`;
        }
        if (tableElement) {
          tableElement.style.width = `${otherColumnsTotalWidth + newWidth}px`;
        }
      };

      const onMouseUp = (moveEvent: MouseEvent) => {
        let deltaX = (moveEvent.pageX - startX) / zoom;
        let finalWidth = startWidth + deltaX;
        if (finalWidth < 60) finalWidth = 60;
        if (finalWidth > 800) finalWidth = 800;

        updateColumn(id, { width: finalWidth });

        document.body.classList.remove('resizing-column');

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    return (
      <th
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onContextMenu={onContextMenu}
        className={`pl-3 pr-1 relative group/col transition-all duration-150 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${isDragOver ? 'bg-slate-100 after:absolute after:left-0 after:top-0 after:w-[2px] after:h-[9999px] after:bg-black after:z-[50] after:pointer-events-none' : ''
          } ${isDragging ? 'opacity-30 bg-slate-50' : ''
          }`}
        style={{ width, minWidth: `${width}px`, maxWidth: `${width}px` }}
      >
        <div className="relative flex items-center w-full h-full">
          <div className="flex-1 min-w-0">
            {isEditable ? (
              <EditableHeaderCell
                label={label}
                onSave={(newVal) => {
                  if (field) {
                    updateColumnLabel(field, newVal);
                  } else {
                    updateColumn(id, { title: newVal });
                  }
                }}
                forceEdit={forceEdit}
                onEditComplete={onEditComplete}
              />
            ) : (
              <span className="font-bold text-[11px] text-slate-500 tracking-wider uppercase mr-2 truncate block">{label}</span>
            )}
          </div>
          {onSort && (
            <div
              className={`absolute right-0 top-0 bottom-0 flex items-center pl-6 pr-1 bg-gradient-to-l from-[#fcfdfd] via-[#fcfdfd]/90 to-transparent pointer-events-none transition-opacity duration-200 ${sortConfig?.column === id ? 'opacity-100' : 'opacity-0 group-hover/col:opacity-100'
                }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSort(id);
                }}
                title={
                  id === 'name' ? (sortConfig?.column === 'name' && sortConfig.direction === 'asc' ? 'Sorted A-Z (Click for Z-A)' : 'Sort A-Z') :
                    id === 'phone' ? 'Sort by Country Code' :
                      id === 'status' ? 'Sort by Pipeline Stage' :
                        id === 'socials' ? 'Bundle by Social Platform' :
                          'Bundle by Location/Country'
                }
                className={`size-5 rounded flex items-center justify-center shrink-0 transition-all cursor-pointer pointer-events-auto ${sortConfig?.column === id
                  ? 'bg-slate-900 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200/70'
                  }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {sortConfig?.column === id
                    ? sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'
                    : 'swap_vert'}
                </span>
              </button>
            </div>
          )}
        </div>
        <div
          onMouseDown={startResize}
          className="absolute -right-[8px] top-0 bottom-0 w-4 cursor-col-resize opacity-0 group-hover/col:opacity-100 transition-opacity z-20 flex justify-center items-center"
        >
          <div className="w-[3px] h-5 bg-black rounded-full transition-colors" />
        </div>
      </th>
    );
  };

const MemoizedLeadRow = React.memo(({
  virtualRow,
  lead,
  stagnant,
  daysAgo,
  isSelected,
  draggedId,
  dragOverId,
  draggedColumnId,
  columns,
  measureRef,
  setDraggedId,
  setDragOverId,
  reorderLeads,
  handleRowSelect,
  renderCell
}: any) => {
  return (
    <tr
      data-index={virtualRow.index}
      ref={measureRef}
      id={`lead-row-${lead.id}`}
      key={lead.id}
      draggable={true}
      onDragStart={(e) => {
        setDraggedId(lead.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        if (draggedColumnId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverId !== lead.id) setDragOverId(lead.id);
      }}
      onDragLeave={() => {
        if (draggedColumnId) return;
        if (dragOverId === lead.id) setDragOverId(null);
      }}
      onDrop={(e) => {
        if (draggedColumnId) return;
        e.preventDefault();
        if (draggedId && draggedId !== lead.id) {
          reorderLeads(draggedId, lead.id);
        }
        setDraggedId(null);
        setDragOverId(null);
      }}
      onDragEnd={() => {
        setDraggedId(null);
        setDragOverId(null);
      }}
      className={`group relative h-12 hover:bg-slate-50/50 transition-all ${stagnant ? 'bg-amber-50/30' : ''} ${isSelected ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''
        } ${dragOverId === lead.id ? 'border-t-2 border-slate-900 bg-slate-100/80 shadow-md' : ''} ${draggedId === lead.id ? 'opacity-40 bg-slate-100' : ''
        }`}
    >
      <td className="w-8 px-2 text-center align-middle cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors">
        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
      </td>
      <td className="w-10 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => handleRowSelect(e, lead.id)}
          onChange={() => { }}
          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer size-3.5"
        />
      </td>
      {columns.map((col: any) => renderCell(col.id, lead, stagnant, daysAgo))}
    </tr>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.lead === nextProps.lead &&
    prevProps.stagnant === nextProps.stagnant &&
    prevProps.daysAgo === nextProps.daysAgo &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.virtualRow.index === nextProps.virtualRow.index &&
    prevProps.columns === nextProps.columns &&
    prevProps.draggedColumnId === nextProps.draggedColumnId &&
    (prevProps.draggedId === nextProps.draggedId || (prevProps.draggedId !== prevProps.lead.id && nextProps.draggedId !== nextProps.lead.id)) &&
    (prevProps.dragOverId === nextProps.dragOverId || (prevProps.dragOverId !== prevProps.lead.id && nextProps.dragOverId !== nextProps.lead.id))
  );
});

export const LeadTable: React.FC<LeadTableProps> = ({ zoom = 1.0, onZoomChange, onMailClick }) => {
  const {
    leads,
    columnLabels,
    columns,
    searchQuery,
    statusFilter,
    addLead,
    updateLead,
    promoteLeadToClient,
    deleteLead,
    selectedLeadIds,
    toggleSelectLead,
    selectAllLeads,
    deselectAllLeads,
    reorderLeads,
    addColumn,
    deleteColumn,
    updateColumn,
    reorderColumns
  } = useLeadStore(); const totalWidth = useMemo(() => {
    return 32 + 40 + (columns || []).reduce((acc, col) => acc + (col.width || 150), 0);
  }, [columns]);

  const hiddenColumns = useMemo(() => {
    const ALL_POTENTIAL_COLUMNS = [
      { id: 'name', title: 'Name' },
      { id: 'type', title: 'Type' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'status', title: 'Pipeline Stage' },
      { id: 'socials', title: 'Socials' },
      { id: 'location', title: 'Location' },
      { id: 'company', title: 'Company' },
      { id: 'estimated_value', title: 'Forecast Value' },
      { id: 'source', title: 'Origin Source' },
      { id: 'tags', title: 'Classification Tags' }
    ];
    const visibleIds = new Set((columns || []).map(c => c.id));
    return ALL_POTENTIAL_COLUMNS.filter(col => !visibleIds.has(col.id));
  }, [columns]);

  const [quickAddName, setQuickAddName] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState({ top: 0, left: 0 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    leadId: string;
    columnId: string;
    value: any;
  } | null>(null);
  const [headerMenu, setHeaderMenu] = useState<{
    x: number;
    y: number;
    columnId: string;
    label: string;
  } | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(() => {
    try {
      const saved = localStorage.getItem('flowstudio-leads-sort');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (sortConfig) {
      localStorage.setItem('flowstudio-leads-sort', JSON.stringify(sortConfig));
    } else {
      localStorage.removeItem('flowstudio-leads-sort');
    }
  }, [sortConfig]);

  // Context Menu window close listeners
  useEffect(() => {
    const handleClose = () => {
      setContextMenu(null);
      setHeaderMenu(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('contextmenu', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('contextmenu', handleClose);
    };
  }, []);

  const handleCellContextMenu = (e: React.MouseEvent, leadId: string, columnId: string, value: any) => {
    e.preventDefault();
    e.stopPropagation();
    setHeaderMenu(null); // Close header menu
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    setContextMenu({
      x: (e.clientX - rect.left) / zoom + wrapper.scrollLeft,
      y: (e.clientY - rect.top) / zoom + wrapper.scrollTop,
      leadId,
      columnId,
      value
    });
  };

  const handleHeaderContextMenu = (e: React.MouseEvent, columnId: string, label: string) => {
    if (columnId === 'actions') return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null); // Close cell menu
    setHeaderMenu({
      x: e.clientX,
      y: e.clientY,
      columnId,
      label
    });
  };

  const lastSelectedRef = useRef<string | null>(null);

  const [isAddingLead, setIsAddingLead] = useState(false);
  const [tempTopLeadIds, setTempTopLeadIds] = useState<Record<string, number>>({});
  const prevLeadsRef = useRef<Lead[]>([]);
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (isAddingLead) {
      const prevIds = new Set(prevLeadsRef.current.map(l => l.id));
      const newLeads = (leads || []).filter(l => !prevIds.has(l.id));

      if (newLeads.length > 0 && prevLeadsRef.current.length > 0) {
        const now = Date.now();
        setTempTopLeadIds(prev => {
          const next = { ...prev };
          newLeads.forEach(l => {
            next[l.id] = now;
          });
          return next;
        });

        newLeads.forEach(l => {
          if (timersRef.current[l.id]) {
            clearTimeout(timersRef.current[l.id]);
          }
          timersRef.current[l.id] = setTimeout(() => {
            setTempTopLeadIds(prev => {
              const next = { ...prev };
              delete next[l.id];
              return next;
            });
            delete timersRef.current[l.id];
          }, 30000);
        });

        setIsAddingLead(false);
      }
    }

    prevLeadsRef.current = leads || [];
  }, [leads, isAddingLead]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleSort = (colId: string) => {
    if (colId === 'type' || colId === 'actions') return;
    setSortConfig(prev => {
      if (!prev || prev.column !== colId) return { column: colId, direction: 'asc' };
      if (prev.direction === 'asc') return { column: colId, direction: 'desc' };
      return null;
    });
  };

  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Zoom level indicator
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevZoomRef = useRef(zoom);

  useEffect(() => {
    if (zoom !== prevZoomRef.current) {
      prevZoomRef.current = zoom;
      setShowZoomIndicator(true);
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
      zoomTimerRef.current = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 1200);
    }
    return () => {
      if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    };
  }, [zoom]);

  useEffect(() => {
    const wrapper = tableWrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomFactor = 0.05;
        const direction = e.deltaY < 0 ? 1 : -1;
        const newZoom = Math.min(1.3, Math.max(0.7, zoomRef.current + (direction * zoomFactor)));
        onZoomChange?.(newZoom);
      }
    };

    const handleScroll = () => {
      setScrollOffset({
        top: wrapper.scrollTop,
        left: wrapper.scrollLeft
      });
    };

    wrapper.addEventListener('wheel', handleWheel, { passive: false });
    wrapper.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      wrapper.removeEventListener('wheel', handleWheel);
      wrapper.removeEventListener('scroll', handleScroll);
    };
  }, [onZoomChange]);

  const getColWidth = (id: string) => columns?.find(c => c.id === id)?.width || 100;

  // Inactivity Check (14 days threshold)
  const isStagnant = (lastUpdatedAtString: string): boolean => {
    const lastUpdate = new Date(lastUpdatedAtString).getTime();
    const now = new Date().getTime();
    const diffDays = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    return diffDays > 14;
  };

  const getDaysInactive = (lastUpdatedAtString: string): number => {
    const lastUpdate = new Date(lastUpdatedAtString).getTime();
    const now = new Date().getTime();
    return Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
  };

  // Safe Arrays Guardrail
  const safeLeads = leads || [];

  // Filter logic
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const filteredLeads = useMemo(() => {
    return safeLeads.filter(lead => {
      const matchesSearch =
        lead.name.toLowerCase().includes((deferredSearchQuery || '').toLowerCase()) ||
        lead.company.toLowerCase().includes((deferredSearchQuery || '').toLowerCase()) ||
        (lead.email || '').toLowerCase().includes((deferredSearchQuery || '').toLowerCase()) ||
        (lead.tags || []).some(t => t.toLowerCase().includes((deferredSearchQuery || '').toLowerCase()));

      if (statusFilter === 'All') return matchesSearch;
      return lead.status === statusFilter && matchesSearch;
    });
  }, [safeLeads, deferredSearchQuery, statusFilter]);

  const getPhoneCountryCode = (phone: string | undefined): string => {
    if (!phone) return 'ZZ_Unknown';
    const clean = phone.replace(/[\s\-\(\)\.]/g, '');
    if (clean.startsWith('+880') || clean.startsWith('880') || /^01[3-9]\d{8}$/.test(clean)) {
      return '01_+880_Bangladesh';
    }
    if (clean.startsWith('+1') || /^1?\d{10}$/.test(clean)) {
      return '02_+1_USA/Canada';
    }
    if (clean.startsWith('+44') || /^07\d{9}$/.test(clean)) {
      return '03_+44_UK';
    }
    if (clean.startsWith('+91')) return '04_+91_India';
    if (clean.startsWith('+61')) return '05_+61_Australia';
    if (clean.startsWith('+49')) return '06_+49_Germany';
    if (clean.startsWith('+33')) return '07_+33_France';
    if (clean.startsWith('+')) return '10_' + clean.substring(0, 4);
    return '50_Other';
  };

  const getStatusWeight = (status: string): number => {
    const s = status.toLowerCase();
    if (s === 'new') return 1;
    if (s === 'proposal sent') return 2;
    if (s === 'contacted' || s === 'connected') return 3;
    if (s === 'lost') return 4;
    if (s === 'archived') return 5;
    return 6;
  };

  const getSocialPlatform = (social: string | undefined): string => {
    if (!social) return 'zz_none';
    const s = social.toLowerCase();
    if (s.includes('facebook') || s.includes('fb.com')) return '01_facebook';
    if (s.includes('linkedin')) return '02_linkedin';
    if (s.includes('twitter') || s.includes('x.com')) return '03_twitter';
    if (s.includes('instagram') || s.includes('insta')) return '04_instagram';
    if (s.includes('whatsapp') || s.includes('wa.me')) return '05_whatsapp';
    if (s.includes('telegram') || s.includes('t.me')) return '06_telegram';
    if (s.includes('github')) return '07_github';
    if (s.includes('dribbble')) return '08_dribbble';
    if (s.includes('behance')) return '09_behance';
    if (s.includes('youtube') || s.includes('youtu.be')) return '10_youtube';
    return '50_other_' + s;
  };

  const getLocationBundle = (loc: string | undefined): string => {
    if (!loc) return 'zz_none';
    const parts = loc.split(',').map(p => p.trim());
    const last = parts[parts.length - 1].toUpperCase();
    if (['NY', 'CA', 'TX', 'IL', 'WA', 'MA', 'FL', 'USA', 'US', 'UNITED STATES'].includes(last)) return '01_USA';
    if (['UK', 'ENGLAND', 'LONDON', 'UNITED KINGDOM'].includes(last)) return '02_UK';
    if (['BD', 'BANGLADESH', 'DHAKA'].includes(last)) return '03_BANGLADESH';
    return '10_' + last;
  };

  const sortedLeads = useMemo(() => {
    const topLeads: Lead[] = [];
    const otherLeads: Lead[] = [];

    filteredLeads.forEach(lead => {
      if (tempTopLeadIds[lead.id]) {
        topLeads.push(lead);
      } else {
        otherLeads.push(lead);
      }
    });

    topLeads.sort((a, b) => (tempTopLeadIds[b.id] || 0) - (tempTopLeadIds[a.id] || 0));

    if (sortConfig) {
      otherLeads.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortConfig.column === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (sortConfig.column === 'phone') {
          valA = getPhoneCountryCode(a.phone);
          valB = getPhoneCountryCode(b.phone);
        } else if (sortConfig.column === 'status') {
          valA = getStatusWeight(a.status);
          valB = getStatusWeight(b.status);
        } else if (sortConfig.column === 'socials') {
          valA = getSocialPlatform(a.socials);
          valB = getSocialPlatform(b.socials);
        } else if (sortConfig.column === 'location') {
          valA = getLocationBundle(a.location);
          valB = getLocationBundle(b.location);
        } else if (sortConfig.column === 'email') {
          const emailA = a.email || '';
          const emailB = b.email || '';
          
          if (emailA === '' && emailB !== '') return sortConfig.direction === 'asc' ? 1 : -1;
          if (emailB === '' && emailA !== '') return sortConfig.direction === 'asc' ? -1 : 1;
          
          valA = emailA.toLowerCase();
          valB = emailB.toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return [...topLeads, ...otherLeads];
  }, [filteredLeads, sortConfig, tempTopLeadIds]);

  const allVisibleSelected = sortedLeads.length > 0 && sortedLeads.every(l => (selectedLeadIds || []).includes(l.id));
  const someVisibleSelected = sortedLeads.some(l => (selectedLeadIds || []).includes(l.id));

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(sortedLeads.map(l => l.id));
      const remaining = (selectedLeadIds || []).filter(id => !visibleIds.has(id));
      selectAllLeads(remaining);
    } else {
      const visibleIds = sortedLeads.map(l => l.id);
      const newSelection = Array.from(new Set([...(selectedLeadIds || []), ...visibleIds]));
      selectAllLeads(newSelection);
    }
  };

  const handleRowSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (e.shiftKey && lastSelectedRef.current) {
      const lastIdx = sortedLeads.findIndex(l => l.id === lastSelectedRef.current);
      const currIdx = sortedLeads.findIndex(l => l.id === id);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const rangeIds = sortedLeads.slice(start, end + 1).map(l => l.id);
        toggleSelectLead(id, rangeIds);
        lastSelectedRef.current = id;
        return;
      }
    }
    toggleSelectLead(id);
    lastSelectedRef.current = id;
  };

  // Calculate Weighted Financial Forecasts
  // 'New' = 10%, 'Contacted' = 30%, 'Proposal Sent' = 80%, 'Archived' = 0%
  const getProbability = (status: string): number => {
    switch (status) {
      case 'New': return 0.1;
      case 'Contacted': return 0.3;
      case 'Proposal Sent': return 0.8;
      case 'Archived': return 0.0;
      default: return 0.0;
    }
  };

  const totalEstimatedValue = filteredLeads.reduce((acc, lead) => {
    // Only count active leads towards forecast value
    return acc + (lead.estimated_value || 0);
  }, 0);

  const weightedFinancialForecast = filteredLeads.reduce((acc, lead) => {
    const coeff = getProbability(lead.status);
    return acc + ((lead.estimated_value || 0) * coeff);
  }, 0);

  // Quick Inline Add Lead Row
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = quickAddName.trim();
    if (!name) return;

    setIsAddingLead(true);
    addLead({
      name,
      company: 'Draft Entity',
      email: '',
      status: 'New',
      estimated_value: 10000,
      source: 'Manual Add',
      notes_summary: 'Baseline entity committed via table quick keyboard entry.',
      tags: ['DRAFT']
    });

    setQuickAddName('');
  };

  // Smart Clip actions copying high fidelity template to clipboard
  const handleSmartCopy = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const text = `Hi ${lead.name},\n\nThanks for reaching out about ${lead.company}! We would love to collaborate with you on these creative directions. Let's schedule a 15-minute quick sync this week to explore this further.\n\nBest regards,\nCreative solutions team`;
    navigator.clipboard.writeText(text);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePromoteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    promoteLeadToClient(id);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this lead from the filesystem database?")) {
      deleteLead(id);
    }
  };

  const getColStyles = (colId: string) => {
    let classes = '';
    if (dragOverColumnId === colId) {
      classes += ' bg-slate-50/60';
    }
    if (draggedColumnId === colId) {
      classes += ' opacity-30 bg-slate-50';
    }
    return classes;
  };

  const renderCell = (colId: string, lead: Lead, stagnant: boolean, daysAgo: number) => {
    switch (colId) {
      case 'name':
        return (
          <td
            key={colId}
            className={`pl-3 pr-1 hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150 h-full align-middle font-display${getColStyles('name')}`}
            onContextMenu={(e) => handleCellContextMenu(e, lead.id, 'name', lead.name)}
          >
            <div className="flex items-center gap-2 h-full w-full">
              <div className="size-6 rounded-full bg-slate-900 border border-slate-200 text-white flex items-center justify-center font-bold text-[10px] shrink-0 select-none">
                {lead.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <InlineEditCell
                  value={lead.name}
                  onSave={(val) => updateLead(lead.id, { name: val, contactPerson: val })}
                  className="w-full flex items-center min-w-0"
                  renderValue={(val) => (
                    <div className="flex items-center gap-1.5 min-w-0 w-full">
                      {isSocialLink(val) && <SocialIcon url={val} />}
                      <span className="truncate font-medium text-slate-800 text-sm block w-full">{val}</span>
                    </div>
                  )}
                />
              </div>
              {stagnant && (
                <div className="flex items-center text-[10px] bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded-full font-bold ml-1 tracking-wide shrink-0 font-mono scale-[0.9]">
                  <span className="material-symbols-outlined text-[10px] mr-0.5">hourglass_empty</span>
                  COLD ({daysAgo}D)
                </div>
              )}
            </div>
          </td>
        );
      case 'type':
        return (
          <td
            key={colId}
            className={`pl-3 pr-1 hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150 align-middle${getColStyles('type')}`}
            onContextMenu={(e) => handleCellContextMenu(e, lead.id, 'type', lead.type || '')}
          >
            <InlineEditCell
              value={lead.type || ''}
              onSave={(val) => updateLead(lead.id, { type: val })}
              className="truncate text-xs text-slate-500 font-medium block w-full min-h-[20px]"
              renderValue={(val) => (
                <div className="flex items-center gap-1.5 min-w-0 w-full">
                  {isSocialLink(val) && <SocialIcon url={val} />}
                  <span className="truncate">{val || <span className="text-slate-300 italic">Unspecified</span>}</span>
                </div>
              )}
            />
          </td>
        );
      case 'email':
        return (
          <td
            key={colId}
            className={`pl-3 pr-1 hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150 align-middle${getColStyles('email')}`}
            onContextMenu={(e) => handleCellContextMenu(e, lead.id, 'email', lead.email || '')}
          >
            <InlineEditCell
              value={lead.email || ''}
              type="email"
              onSave={(val) => updateLead(lead.id, { email: val })}
              className="truncate text-xs font-mono text-slate-600 block w-full min-h-[20px]"
              renderValue={(val) => (
                <div className="flex items-center gap-1.5 min-w-0 w-full">
                  {isSocialLink(val) && <SocialIcon url={val} />}
                  <span className="truncate">{val || <span className="text-slate-300 italic font-sans text-xs">No email</span>}</span>
                </div>
              )}
            />
          </td>
        );
      case 'phone':
        return (
          <td
            key={colId}
            className={`pl-3 pr-1 hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150 align-middle text-slate-600 font-mono text-xs${getColStyles('phone')}`}
            onContextMenu={(e) => handleCellContextMenu(e, lead.id, 'phone', lead.phone || '')}
          >
            <InlineEditCell
              value={lead.phone || ''}
              onSave={(val) => updateLead(lead.id, { phone: val })}
              className="truncate block w-full"
              renderValue={(val) => (
                <div className="flex items-center gap-1.5 min-w-0 w-full">
                  {isSocialLink(val) && <SocialIcon url={val} />}
                  <span className="truncate">{val || <span className="text-slate-300 italic font-sans text-xs">No phone</span>}</span>
                </div>
              )}
            />
          </td>
        );
      case 'status':
        return (
          <td
            key={colId}
            className={`pl-3 pr-1 hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150 align-middle${getColStyles('status')}`}
            onClick={e => e.stopPropagation()}
            onContextMenu={(e) => handleCellContextMenu(e, lead.id, 'status', lead.status)}
          >
            <InlineEditCell
              value={lead.status}
              type="status"
              onSave={(val) => updateLead(lead.id, { status: val })}
              className="flex items-center w-full min-w-0 overflow-hidden"
              renderValue={(val) => (
                <div className="flex items-center gap-1.5 min-w-0 w-full">
                  {isSocialLink(val) && <SocialIcon url={val} />}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider truncate max-w-full inline-block ${val === 'New' ? 'bg-[#34d399]/10 text-emerald-800 border border-[#34d399]/20' :
                    val === 'Contacted' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                      val === 'Proposal Sent' ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20' :
                        'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                    {val}
                  </span>
                </div>
              )}
            />
          </td>
        );
      case 'socials':
        return (
          <td
            key={colId}
            className={`pl-3 pr-1 hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150 align-middle${getColStyles('socials')}`}
            onContextMenu={(e) => handleCellContextMenu(e, lead.id, 'socials', lead.socials || '')}
          >
            <InlineEditCell
              value={lead.socials || ''}
              onSave={(val) => updateLead(lead.id, { socials: val })}
              className="truncate text-xs text-slate-500 font-medium block w-full"
              renderValue={(val) => {
                if (!val) return <span className="text-slate-300 italic">No link</span>;
                let href = val;
                if (!/^https?:\/\//i.test(val)) {
                  href = 'https://' + val;
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 min-w-0 hover:underline hover:text-slate-900"
                    title="Ctrl+Click to open in new tab"
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(href, '_blank', 'noopener,noreferrer');
                      } else {
                        e.preventDefault();
                      }
                    }}
                  >
                    <SocialIcon url={val} />
                    <span className="truncate">{val}</span>
                  </a>
                );
              }}
            />
          </td>
        );
      case 'location':
        return (
          <td
            key={colId}
            className={`pl-3 pr-1 hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150 align-middle${getColStyles('location')}`}
            onContextMenu={(e) => handleCellContextMenu(e, lead.id, 'location', lead.location || '')}
          >
            <InlineEditCell
              value={lead.location || ''}
              onSave={(val) => updateLead(lead.id, { location: val })}
              className="truncate text-xs text-slate-500 font-medium block w-full"
              renderValue={(val) => (
                <div className="flex items-center gap-1.5 min-w-0 w-full">
                  {isSocialLink(val) && <SocialIcon url={val} />}
                  <span className="truncate">{val || <span className="text-slate-300 italic">Unspecified</span>}</span>
                </div>
              )}
            />
          </td>
        );
      case 'actions':
        return (
          <td key={colId} className={`pl-3 pr-1 text-left hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150${getColStyles('actions')}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-start gap-1">
              {/* Mail action button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMailClick?.(lead.id);
                }}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title="Send Email"
              >
                <span className="material-symbols-outlined text-[16px]">mail</span>
              </button>

              {/* Promote button */}
              {lead.status !== 'Archived' && (
                <button
                  onClick={(e) => handlePromoteClick(e, lead.id)}
                  className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                  title="Promote to Active Client"
                >
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                </button>
              )}

              {/* Delete */}
              <button
                onClick={(e) => handleDeleteClick(e, lead.id)}
                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all animate-in"
                title="Delete Lead"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </td>
        );
      default:
        // Generic dynamic custom column!
        const rawValue = lead[colId as keyof Lead] ?? '';
        const valueString = Array.isArray(rawValue) ? rawValue.join(', ') : String(rawValue);

        return (
          <td
            key={colId}
            className={`pl-3 pr-1 hover:shadow-[inset_0_0_0_1px_#cbd5e1] hover:rounded-sm transition-all duration-150 align-middle${getColStyles(colId)}`}
            onContextMenu={(e) => handleCellContextMenu(e, lead.id, colId, rawValue)}
          >
            <InlineEditCell
              value={valueString}
              onSave={(val) => {
                if (colId === 'estimated_value') {
                  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
                  updateLead(lead.id, { [colId]: isNaN(num) ? 0 : num });
                } else if (colId === 'tags') {
                  updateLead(lead.id, { [colId]: val.split(',').map(t => t.trim()).filter(Boolean) });
                } else {
                  updateLead(lead.id, { [colId]: val });
                }
              }}
              className="truncate text-xs text-slate-500 font-medium block w-full min-h-[20px]"
              renderValue={(val) => {
                if (colId === 'estimated_value') {
                  return typeof rawValue === 'number' ? `$${rawValue.toLocaleString()}` : `$${val}`;
                }
                return val || <span className="text-slate-300 italic font-sans text-xs">Unspecified</span>;
              }}
            />
          </td>
        );
    }
  };

  const rowVirtualizer = useVirtualizer({
    count: sortedLeads.length,
    getScrollElement: () => tableWrapperRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0)
    : 0;

  const globalStyles = useMemo(() => (
    <style>{`
      body.resizing-column * {
        cursor: col-resize !important;
        user-select: none !important;
      }
      body.resizing-column th div.absolute,
      body.resizing-column th button {
        pointer-events: none !important;
      }
    `}</style>
  ), []);

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0 relative select-none">
      {globalStyles}

      {/* Scrollable Table Wrapper */}
      <div
        ref={tableWrapperRef}
        className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative [&::-webkit-scrollbar]:h-[5px] [&::-webkit-scrollbar]:w-[5px] [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
        style={{ zoom }}
      >
        <table
          className="w-max text-left border-collapse table-fixed"
          style={{ width: `${totalWidth}px` }}
          onDragOver={(e) => {
            if (!draggedColumnId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const cell = (e.target as HTMLElement).closest('th, td') as HTMLTableCellElement;
            if (cell && cell.cellIndex >= 2) {
              const colIdx = cell.cellIndex - 2;
              const col = columns[colIdx];
              if (col && col.id !== 'actions' && col.id !== draggedColumnId) {
                if (dragOverColumnId !== col.id) {
                  setDragOverColumnId(col.id);
                }
              }
            }
          }}
          onDrop={(e) => {
            if (!draggedColumnId) return;
            e.preventDefault();
            const cell = (e.target as HTMLElement).closest('th, td') as HTMLTableCellElement;
            if (cell && cell.cellIndex >= 2) {
              const colIdx = cell.cellIndex - 2;
              const col = columns[colIdx];
              if (col && col.id !== 'actions' && col.id !== draggedColumnId) {
                reorderColumns(draggedColumnId, col.id);
              }
            }
            setDraggedColumnId(null);
            setDragOverColumnId(null);
          }}
        >
          <colgroup>
            <col style={{ width: '32px' }} />
            <col style={{ width: '40px' }} />
            {columns.map((col) => (
              <col key={col.id} id={`col-width-${col.id}`} style={{ width: `${col.width || 150}px` }} />
            ))}
          </colgroup>
          {/* Table Head */}
          <thead className="bg-[#fcfdfd] border-b border-slate-200/80 sticky top-0 z-35">
            <tr className="h-11">
              <th className="w-8 px-2 text-center sticky left-0 z-10 bg-[#fcfdfd]" />
              <th className="w-10 px-3 text-center sticky left-8 z-10 bg-[#fcfdfd]">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = !allVisibleSelected && someVisibleSelected;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer size-3.5"
                />
              </th>
              {columns.map((col) => {
                const isStandard = ['name', 'type', 'email', 'phone', 'status', 'socials', 'location'].includes(col.id);
                const label = col.id === 'actions' ? 'Actions' : (isStandard ? (columnLabels[col.id as keyof ColumnLabels] || col.title) : col.title);

                return (
                  <ResizableHeader
                    key={col.id}
                    id={col.id}
                    field={isStandard ? col.id as any : undefined}
                    label={label}
                    sortConfig={sortConfig}
                    onSort={['name', 'phone', 'status', 'socials', 'location', 'email'].includes(col.id) ? handleSort : undefined}
                    onContextMenu={(e) => handleHeaderContextMenu(e, col.id, label)}
                    isEditable={col.id !== 'actions'}
                    zoom={zoom}
                    forceEdit={editingColumnId === col.id}
                    onEditComplete={() => setEditingColumnId(null)}
                    draggable={col.id !== 'actions'}
                    isDragging={draggedColumnId === col.id}
                    isDragOver={dragOverColumnId === col.id}
                    onDragStart={(e) => {
                      setDraggedColumnId(col.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', col.id);
                    }}
                    onDragEnd={() => {
                      setDraggedColumnId(null);
                      setDragOverColumnId(null);
                    }}
                  />
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 hover:divide-y">
            {/* Quick Add Row Input */}
            <tr className="h-12 border-t border-slate-100 bg-[#fbfcfc]/30">
              <td colSpan={columns.length + 2} className="px-4 py-0">
                <form onSubmit={handleQuickAddSubmit} className="flex items-center gap-2 w-full">
                  <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">add</span>
                  <input
                    type="text"
                    placeholder="Quick Add Lead... (Type name & hit Enter)"
                    value={quickAddName}
                    onChange={(e) => setQuickAddName(e.target.value)}
                    className="flex-1 bg-transparent border-none text-xs text-slate-700 placeholder-slate-400 outline-none py-3 font-medium"
                  />
                  {quickAddName && (
                    <button
                      type="submit"
                      className="bg-slate-950 text-white rounded px-2.5 py-1 text-[10px] font-bold mr-2 uppercase tracking-wider shadow-sm"
                    >
                      Instant Add
                    </button>
                  )}
                </form>
              </td>
            </tr>

            {sortedLeads.length > 0 && (
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td colSpan={(columns || []).length + 2} style={{ height: `${paddingTop}px` }} />
                  </tr>
                )}

                {virtualItems.map((virtualRow) => {
                  const lead = sortedLeads[virtualRow.index];
                  const stagnant = isStagnant(lead.last_updated_at) && lead.status !== 'Archived';
                  const daysAgo = getDaysInactive(lead.last_updated_at);
                  const isSelected = (selectedLeadIds || []).includes(lead.id);

                  return (
                    <MemoizedLeadRow
                      key={lead.id}
                      virtualRow={virtualRow}
                      lead={lead}
                      stagnant={stagnant}
                      daysAgo={daysAgo}
                      isSelected={isSelected}
                      draggedId={draggedId}
                      dragOverId={dragOverId}
                      draggedColumnId={draggedColumnId}
                      columns={columns}
                      measureRef={rowVirtualizer.measureElement}
                      setDraggedId={setDraggedId}
                      setDragOverId={setDragOverId}
                      reorderLeads={reorderLeads}
                      handleRowSelect={handleRowSelect}
                      renderCell={renderCell}
                    />
                  );
                })}

                {paddingBottom > 0 && (
                  <tr>
                    <td colSpan={(columns || []).length + 2} style={{ height: `${paddingBottom}px` }} />
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>

        {/* Floating Context Menu */}
        {contextMenu && (
          <div
            className="absolute z-[30] bg-white border border-slate-200/90 rounded-xl shadow-soft flex flex-col py-1.5 min-w-[160px] animate-in fade-in duration-100 font-sans"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
          <button
            onClick={() => {
              navigator.clipboard.writeText(String(contextMenu.value || ''));
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            Copy Cell
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(String(contextMenu.value || ''));
              updateLead(contextMenu.leadId, { [contextMenu.columnId]: '' });
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">content_cut</span>
            Cut Cell
          </button>

          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                updateLead(contextMenu.leadId, { [contextMenu.columnId]: text });
              } catch (err) {
                console.error('Failed to read clipboard', err);
              }
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">content_paste</span>
            Paste
          </button>

          <button
            onClick={() => {
              updateLead(contextMenu.leadId, { [contextMenu.columnId]: '' });
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">backspace</span>
            Clear Cell
          </button>

          <div className="border-t border-slate-100 my-1"></div>

          <button
            onClick={() => {
              const lead = leads.find(l => l.id === contextMenu.leadId);
              if (lead) {
                navigator.clipboard.writeText(JSON.stringify(lead, null, 2));
              }
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            Copy Row JSON
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this lead?')) {
                deleteLead(contextMenu.leadId);
              }
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete Row
          </button>

          <div className="border-t border-slate-100 my-1"></div>

          {/* Unhide Column Sub-menu */}
          <div className="relative group">
            <button
              className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Unhide Column
              </div>
              <span className="material-symbols-outlined text-[14px] text-slate-400">chevron_right</span>
            </button>

            <div className="absolute left-full top-0 ml-0.5 bg-white border border-slate-200/90 rounded-xl shadow-soft hidden group-hover:block flex-col py-1.5 min-w-[150px] z-[1000] animate-in fade-in duration-100">
              {hiddenColumns.length === 0 ? (
                <span className="px-3.5 py-2 text-[10px] italic text-slate-400 block text-center">No hidden columns</span>
              ) : (
                hiddenColumns.map(col => (
                  <button
                    key={col.id}
                    onClick={() => {
                      addColumn(col.id, col.title);
                      setContextMenu(null);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
                  >
                    {col.title}
                  </button>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => {
              const uniqueId = `custom_${Date.now()}`;
              addColumn(uniqueId, 'Untitled');
              setEditingColumnId(uniqueId);
              setContextMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Add Column
          </button>

          {contextMenu.columnId !== 'actions' && contextMenu.columnId !== 'name' && (
            <>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  deleteColumn(contextMenu.columnId);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                Hide Column
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete column "${columns.find(c => c.id === contextMenu.columnId)?.title || contextMenu.columnId}"?`)) {
                    deleteColumn(contextMenu.columnId);
                  }
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Delete Column
              </button>
            </>
          )}
          </div>
        )}
      </div>

      {/* Floating Column Title Context Menu */}
      {headerMenu && (
        <div
          className="fixed z-[999] bg-white border border-slate-200/90 rounded-xl shadow-soft flex flex-col py-1.5 min-w-[140px] animate-in fade-in duration-100 font-sans"
          style={{ top: headerMenu.y, left: headerMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setEditingColumnId(headerMenu.columnId);
              setHeaderMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Rename
          </button>

          <button
            onClick={() => {
              deleteColumn(headerMenu.columnId);
              setHeaderMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">visibility_off</span>
            Hide
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete column "${headerMenu.label}"? This will hide it from the table.`)) {
                deleteColumn(headerMenu.columnId);
              }
              setHeaderMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete
          </button>

          <div className="border-t border-slate-100 my-1"></div>

          {/* Unhide Column Sub-menu */}
          <div className="relative group">
            <button
              className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                Unhide Column
              </div>
              <span className="material-symbols-outlined text-[14px] text-slate-400">chevron_right</span>
            </button>

            <div className="absolute left-full top-0 ml-0.5 bg-white border border-slate-200/90 rounded-xl shadow-soft hidden group-hover:block flex-col py-1.5 min-w-[150px] z-[1000] animate-in fade-in duration-100">
              {hiddenColumns.length === 0 ? (
                <span className="px-3.5 py-2 text-[10px] italic text-slate-400 block text-center">No hidden columns</span>
              ) : (
                hiddenColumns.map(col => (
                  <button
                    key={col.id}
                    onClick={() => {
                      addColumn(col.id, col.title);
                      setHeaderMenu(null);
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
                  >
                    {col.title}
                  </button>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => {
              const uniqueId = `custom_${Date.now()}`;
              addColumn(uniqueId, 'Untitled');
              setEditingColumnId(uniqueId);
              setHeaderMenu(null);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left w-full cursor-pointer border-none bg-transparent"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Add Column
          </button>
          </div>
        )}

      {sortedLeads.length === 0 && (
        <div 
          className="absolute inset-x-0 bottom-0 flex items-center justify-center pointer-events-none z-30"
          style={{ top: `${92 * zoom}px` }}
        >
          <div className="pointer-events-auto bg-white/50 backdrop-blur-[2px] w-full h-full flex items-center justify-center pb-20">
            <EmptyState
              title={searchQuery ? "No leads found" : "Syncing customers"}
              description={
                searchQuery
                  ? "We couldn't find any leads matching your search criteria."
                  : "Hang tight! We're still hooking up your userbase.\nPlease check back in a few minutes."
              }
              primaryAction={
                searchQuery
                  ? undefined
                  : { label: "Notify me", icon: <Bell className="size-4" />, onClick: () => {} }
              }
              secondaryAction={
                searchQuery
                  ? undefined
                  : { label: "Refresh page", icon: <RefreshCw className="size-4" />, onClick: () => window.location.reload() }
              }
            />
          </div>
        </div>
      )}
      {/* Zoom Level Indicator */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 pointer-events-none ${
          showZoomIndicator
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="flex items-center gap-2 bg-zinc-900 text-white pl-3 pr-3.5 py-2 rounded-full shadow-2xl border border-zinc-700/50">
          <span className="material-symbols-outlined text-[16px] text-zinc-400">search</span>
          <span className="text-[13px] font-semibold tracking-wide tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
