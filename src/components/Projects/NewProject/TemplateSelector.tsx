import React from 'react';

interface TemplateCardProps {
  title: string;
  description: string;
  icon: string;
  isBuiltIn?: boolean;
  isStartFromScratch?: boolean;
  colorClass?: string;
  iconColorClass?: string;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ 
  title, 
  description, 
  icon, 
  isBuiltIn, 
  isStartFromScratch,
  colorClass = "bg-slate-50",
  iconColorClass = "text-slate-600"
}) => {
  return (
    <div className={`relative p-4 rounded-2xl border transition-all cursor-pointer group h-full flex flex-col overflow-hidden ${
      isStartFromScratch 
        ? 'border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary' 
        : 'border-border-light bg-white hover:border-primary/30 hover:shadow-soft-hover'
    }`}>
      {isBuiltIn && (
        <span className="absolute top-3 right-3 z-10 text-[9px] font-bold bg-white/90 backdrop-blur-sm text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wide shadow-sm border border-slate-100">
          Built-in
        </span>
      )}
      
      {/* Graphical Area */}
      <div className={`mb-3 aspect-[4/3] rounded-xl flex items-center justify-center relative overflow-hidden ${
        isStartFromScratch ? 'bg-transparent' : colorClass
      }`}>
        {/* Background Pattern/Gradient */}
        {!isStartFromScratch && (
          <>
            <div className="absolute top-0 right-0 size-24 bg-white/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
            <div className="absolute bottom-0 left-0 size-16 bg-black/5 rounded-full -ml-8 -mb-8 blur-lg"></div>
          </>
        )}

        {/* Icon */}
        <div className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${
          isStartFromScratch 
            ? 'size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary' 
            : iconColorClass
        }`}>
          <span className="material-symbols-outlined text-[40px] drop-shadow-sm">{icon}</span>
        </div>
      </div>
      
      <h3 className="text-sm font-bold text-slate-900 mb-0.5 truncate">{title}</h3>
      <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">{description}</p>
    </div>
  );
};

export const TemplateSelector: React.FC = () => {
  const templates = [
    {
      title: "Start from scratch",
      description: "No predefined structure",
      icon: "add",
      isStartFromScratch: true
    },
    {
      title: "Social Media Pack",
      description: "Instagram, Facebook, Assets",
      icon: "share",
      isBuiltIn: true,
      colorClass: "bg-purple-100",
      iconColorClass: "text-purple-600"
    },
    {
      title: "Web Design Pack",
      description: "Landing pages and UI kit",
      icon: "language",
      isBuiltIn: true,
      colorClass: "bg-emerald-100",
      iconColorClass: "text-emerald-600"
    },
    {
      title: "Brand Identity",
      description: "Guidelines and typography",
      icon: "auto_awesome",
      isBuiltIn: true,
      colorClass: "bg-amber-100",
      iconColorClass: "text-amber-600"
    },
    {
      title: "Logo Design Pack",
      description: "Vector logos and lockups",
      icon: "pentagon",
      isBuiltIn: true,
      colorClass: "bg-rose-100",
      iconColorClass: "text-rose-600"
    },
    {
      title: "Video Production",
      description: "Storyboards and motion",
      icon: "videocam",
      isBuiltIn: true,
      colorClass: "bg-cyan-100",
      iconColorClass: "text-cyan-600"
    }
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
        Template Selection <span className="text-slate-400 font-normal text-xs">(OPTIONAL)</span>
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map((template, index) => (
          <TemplateCard key={index} {...template} />
        ))}
      </div>
    </div>
  );
};
