import React from 'react';
import { useSettingsContext } from '../../context/SettingsContext';
import { useAuthStore } from '../../stores/authStore';

interface DashboardHeaderProps {
  onNavigate?: (view: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onNavigate }) => {
  const { settings } = useSettingsContext();
  const { user } = useAuthStore();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = settings?.displayName || user?.displayName || 'User';

  return (
    <header className="mb-2">

      <h1 className="text-3xl font-extrabold text-slate-900 mt-4 tracking-tight">{greeting}, {name}</h1>
    </header>
  );
};
