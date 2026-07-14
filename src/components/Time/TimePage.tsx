import React from 'react';
import { Timer } from 'lucide-react';
import { ComingSoon } from '../GlobalComponents/ComingSoon';

export const TimePage: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-[#fcfdfd] overflow-hidden relative">
      
      {/* Main Content Area - Coming Soon */}
      <section className="flex-1 flex flex-col min-h-0 bg-white relative">
        <ComingSoon />
      </section>
    </div>
  );
};
