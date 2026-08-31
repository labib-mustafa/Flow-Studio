import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeamStore, TeamRole } from '../../stores/teamStore';
import { Image, Folder, Camera, Pencil, Check, Trash2, RotateCcw, X, ChevronDown, Search, Plus } from 'lucide-react';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
  onMemberAdded?: () => void;
}

const ROLES: { role: TeamRole; desc: string }[] = [
  { role: 'Owner', desc: 'Full administrative access to workspace, billing, and team settings.' },
  { role: 'Admin', desc: 'Can manage workspace projects, clients, and directory members.' },
  { role: 'Manager', desc: 'Can create projects, assign tasks, and review deliverables.' },
  { role: 'Designer', desc: 'Can edit moodboards, canvas assets, and design files.' },
  { role: 'Developer', desc: 'Can inspect code specifications and export production assets.' },
  { role: 'Guest', desc: 'Limited read-only access to specifically assigned projects.' }
];

export const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, memberId, onMemberAdded }) => {
  const members = useTeamStore((state) => state.members);
  const updateMember = useTeamStore((state) => state.updateMember);
  const addMember = useTeamStore((state) => state.addMember);
  const customRoles = useTeamStore((state) => state.customRoles || []);
  const addCustomRole = useTeamStore((state) => state.addCustomRole);
  const removeCustomRole = useTeamStore((state) => state.removeCustomRole);

  const allRoles = [
    ...ROLES,
    ...customRoles.map((cr) => ({ role: cr, desc: 'Custom workspace role designation.' }))
  ];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('Designer');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [activeFocus, setActiveFocus] = useState('');
  const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
  const [banner, setBanner] = useState<string | undefined>(undefined);
  const [bannerScale, setBannerScale] = useState<number>(1);
  const [bannerX, setBannerX] = useState<number>(0);
  const [bannerY, setBannerY] = useState<number>(0);
  const [isEditingBanner, setIsEditingBanner] = useState<boolean>(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [profilePicScale, setProfilePicScale] = useState<number>(1);
  const [profilePicX, setProfilePicX] = useState<number>(0);
  const [profilePicY, setProfilePicY] = useState<number>(0);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const picStart = useRef({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const isDraggingBanner = useRef(false);
  const bannerDragStart = useRef({ x: 0, y: 0 });
  const bannerPicStart = useRef({ x: 0, y: 0 });
  const bannerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (memberId) {
        const member = members.find((m) => m.id === memberId);
        if (member) {
          setName(member.name || '');
          setEmail(member.email || '');
          setRole(member.role || 'Designer');
          setPhone(member.phone || '');
          setDepartment(member.department || 'General');
          setBio(member.bio || '');
          setActiveFocus(member.activeFocus || '');
          setProfilePic(member.profilePic);
          setBanner(member.banner);
          setProfilePicScale(member.profilePicScale ?? 1);
          setProfilePicX(member.profilePicX ?? 0);
          setProfilePicY(member.profilePicY ?? 0);
          setBannerScale(member.bannerScale ?? 1);
          setBannerX(member.bannerX ?? 0);
          setBannerY(member.bannerY ?? 0);
          setIsEditingBanner(false);
        }
      } else {
        setName('');
        setEmail('');
        setRole('Designer');
        setPhone('');
        setDepartment('');
        setBio('');
        setActiveFocus('');
        setProfilePic(undefined);
        setBanner(undefined);
        setProfilePicScale(1);
        setProfilePicX(0);
        setProfilePicY(0);
        setBannerScale(1);
        setBannerX(0);
        setBannerY(0);
        setIsEditingBanner(false);
      }
    }
  }, [isOpen, memberId, members]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    if (isRoleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isRoleDropdownOpen]);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomSensitivity = 0.0008;
        setProfilePicScale((prev) => Math.max(0.1, Math.min(5, prev - e.deltaY * zoomSensitivity)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [profilePic, isOpen]);

  useEffect(() => {
    const container = bannerContainerRef.current;
    if (!container || !isEditingBanner) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomSensitivity = 0.0008;
        setBannerScale((prev) => Math.max(0.1, Math.min(5, prev - e.deltaY * zoomSensitivity)));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [banner, isEditingBanner, isOpen]);

  const handleBannerMouseDown = (e: React.MouseEvent) => {
    if (!isEditingBanner) return;
    isDraggingBanner.current = true;
    bannerDragStart.current = { x: e.clientX, y: e.clientY };
    bannerPicStart.current = { x: bannerX, y: bannerY };
  };

  const handleBannerMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingBanner.current || !isEditingBanner) return;
    const dx = e.clientX - bannerDragStart.current.x;
    const dy = e.clientY - bannerDragStart.current.y;
    setBannerX(bannerPicStart.current.x + dx);
    setBannerY(bannerPicStart.current.y + dy);
  };

  const handleBannerMouseUp = () => {
    isDraggingBanner.current = false;
  };

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfilePic(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBanner(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTriggerBannerUpload = () => {
    bannerInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (memberId) {
      updateMember(memberId, {
        name: name.trim(),
        email: email.trim(),
        role,
        phone: phone.trim(),
        department: department.trim() || 'General',
        bio: bio.trim(),
        activeFocus: activeFocus.trim(),
        profilePic,
        banner,
        profilePicScale,
        profilePicX,
        profilePicY,
        bannerScale,
        bannerX,
        bannerY
      });
    } else {
      addMember({
        name: name.trim(),
        email: email.trim(),
        role,
        phone: phone.trim(),
        department: department.trim() || 'General',
        bio: bio.trim(),
        activeFocus: activeFocus.trim(),
        profilePic,
        banner,
        profilePicScale,
        profilePicX,
        profilePicY,
        bannerScale,
        bannerX,
        bannerY,
        status: 'active',
        assignedProjects: []
      });
      onMemberAdded?.();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl w-full max-w-4xl overflow-hidden text-left max-h-[95vh] flex flex-col font-plus-jakarta"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-center justify-between bg-white shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-[#111111]">
                {memberId ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <p className="text-xs text-[#6b7280] mt-0.5">
                {memberId
                  ? 'Update profile details, designation, and permissions.'
                  : 'Create an active workspace profile without sending an invite.'}
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-[#6b7280] hover:text-[#111111] hover:bg-[#f3f4f6] rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {/* Left Column: Live Card Preview & Layout Position Adjusters */}
              <div className="w-[304px] shrink-0 mx-auto space-y-4">

                {/* Sandbox Card UI */}
                <div className="relative h-[460px] w-[304px] bg-[#B9B9B9] rounded-[20px] overflow-hidden select-none border border-slate-200 shadow-sm">
                  {profilePic ? (
                    <div
                      ref={previewContainerRef}
                      className="absolute inset-x-0 top-0 h-[316px] w-full overflow-hidden cursor-move"
                      onMouseDown={(e) => {
                        isDragging.current = true;
                        dragStart.current = { x: e.clientX, y: e.clientY };
                        picStart.current = { x: profilePicX, y: profilePicY };
                      }}
                      onMouseMove={(e) => {
                        if (!isDragging.current) return;
                        const dx = e.clientX - dragStart.current.x;
                        const dy = e.clientY - dragStart.current.y;
                        setProfilePicX(picStart.current.x + dx);
                        setProfilePicY(picStart.current.y + dy);
                      }}
                      onMouseUp={() => { isDragging.current = false; }}
                      onMouseLeave={() => { isDragging.current = false; }}
                    >
                      <img
                        src={profilePic}
                        alt={name || 'Preview'}
                        className="w-full h-full object-cover origin-center pointer-events-none"
                        style={{
                          transform: `scale(${profilePicScale}) translate(${profilePicX}px, ${profilePicY}px)`
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-x-0 top-0 h-[316px] flex items-center justify-center">
                      <Image className="w-12 h-12 text-[#9E9E9E]" />
                    </div>
                  )}

                  {/* SVG at the bottom */}
                  <svg className="absolute bottom-0 left-0 w-full overflow-hidden" viewBox="0 0 304 181" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <clipPath id={`card-clip-preview`}>
                        <path d="M304 36.26V181H0V0H183.33C194.11 0 204.57 3.72 212.92 10.54L231.52 25.72C239.87 32.54 250.33 36.26 261.11 36.26H304Z" />
                      </clipPath>
                    </defs>
                    {/* Main black card background */}
                    <path d="M304 36.26V181H0V0H183.33C194.11 0 204.57 3.72 212.92 10.54L231.52 25.72C239.87 32.54 250.33 36.26 261.11 36.26H304Z" fill="#121214" />

                    {/* Drafting Compass Graphic (PNG) inside the SVG, clipped to the card shape */}
                    <g clipPath={`url(#card-clip-preview)`}>
                      <image
                        href="data:image/png;base64,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ECBAYKyA9QgQIECAAIGdBRToOydA9wQIECBAoA8BoyRAgAABAgSuCSjQrwl5nQABAgQIEChfQIQECBAgQKABAQV6A0k0BAIECBAgQGBdAa0TIECAAIEtBBToWyjrgwABAgQIECBwXsArBAgQIEDgo4AC/SODfwgQIECAAAECrQoYFwECBAjUIqBAryVT4iRAgAABAgQIlCggJgIECBDIJqBAz0apIQIECBAgQIAAgdwC2iNAgEBPAgr0nrJtrAQIECBAgAABAncFPCZAgEBRAgr0otIhGAIECBAgQIAAgXYEjIQAAQLTBBTo07ysTYAAAQIECBAgQKAMAVEQINCcgAK9uZQaEAECBAgQIECAAIHlAlogQGB7AQX69uZ6JECAAAECBAgQINC7gPETIHBCQIF+AsVTBAgQIECAAAECBAjULCB2AnUKKNDrzJuoCRAgQIAAAQIECBDYS0C/BFYSUKCvBKtZAgQIECBAgAABAgQIzBGwTb8CCvR+c2/kBAgQIECAAAECBAj0J2DEBQso0AtOjtAIECBAgAABAgQIECBQl4Bolwgo0Jfo2ZYAAQIECBAgQIAAAQIEthNovCcFeuMJNjwCBAgQIECAAAECBAgQGCew91oK9L0zoH8CBAgQIECAAAECBAgQ6EHg6hgV6FeJrECAAAECBAgQIECAAAECBNYXWFagrx+fHggQIECAAAECBAgQIECAQBcCRRfoXWTAIAkQIECAAAECBAgQIECAQBLouUBPw3cjQIAAAQIECBAgQIAAAQJlCCjQV8uDhgkQIECAAAECBAgQIECAwHgBBfp4q7LWFA0BAgQIECBAgAABAgQINCWgQG8qnfkGoyUCBAgQIECAAAECBAgQ2FZAgb6tt94+CfiXAAECBAgQIECAAAECBB4IKNAfgPizBQFjIECAAAECBAgQIECAQH0CCvT6cibivQX0T4AAAQIECBAgQIAAgRUEFOgroGqSwBIB2xIgQIAAAQIECBAg0KeAAr3PvBt1vwJGToAAAQIECBAgQIBAoQIK9EITIywCdQqImgABAgQIECBAgACBuQIK9LlytiNAYHsBPRIgQIAAAQIECBBoWECB3nByDY0AgWkC1iZAgAABAgQIECCwp4ACfU99fRMg0JOAsRIgQIAAAQIECBC4KKBAv8jjRQIECNQiIE4CBAgQIECAAIHaBRTotWdQ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"
                        x="133"
                        y="-56"
                        width="256"
                        height="256"
                        transform="translate(261, 79) rotate(28) scale(0.7) translate(-261, -79)"
                        style={{ opacity: 0.12, mixBlendMode: 'screen' }}
                      />
                    </g>
                  </svg>

                  {/* Text Overlay */}
                  <div
                    className="absolute bottom-0 left-0 w-full h-[181px] px-[20px] py-[17px] flex flex-col justify-between z-10 text-white select-none text-left">
                    {/* Top part: Name, Email, Projects count */}
                    <div className="flex flex-col gap-[6px]">
                      <h2 className="text-[24px] font-semibold tracking-normal text-white line-clamp-1 leading-none">
                        {name || 'Name'}
                      </h2>
                      <p className="text-[12px] text-[white] opacity-[60%] font-normal line-clamp-1">{email || 'email@example.com'}</p>
                      <div className="flex items-center gap-[5px] mt-2 text-[12px] text-slate-300">
                        <Folder className="w-3.5 h-3.5 text-white opacity-[60%]" />
                        <span className="text-[white] opacity-[60%] font-medium">
                          Projects : {memberId ? (members.find((m) => m.id === memberId)?.assignedProjects?.length || 0) : 0}
                        </span>
                      </div>
                    </div>

                    {/* Bottom part: Title and ID */}
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#00F5FF] font-normal text-[12px]">{role}</span>
                      <span className="text-white font-normal text-[12px]">
                        ID: Token_{memberId ? memberId.replace('m_', '').substring(0, 8) : 'new_mbr'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sizing Controls */}
                {profilePic && (
                  <div className="bg-[#f9fafb] p-4 rounded-xl border border-[#e5e7eb] space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-none">Photo Controls</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePicScale(1);
                          setProfilePicX(0);
                          setProfilePicY(0);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer uppercase tracking-wider"
                      >
                        Reset
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Drag the image above to pan, or hold <kbd className="px-1.5 py-0.5 bg-slate-200 border border-slate-300 rounded text-[9px] font-mono font-bold">Ctrl</kbd> + scroll to zoom.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Form Inputs */}
              <div className="flex-1 space-y-6 w-full">
                {/* Banner Section */}
                <div className="relative group w-full h-32 rounded-xl overflow-hidden border border-[#e5e7eb] bg-[#f9fafb] mb-4">
                  <div
                    ref={bannerContainerRef}
                    onClick={isEditingBanner ? undefined : handleTriggerBannerUpload}
                    onMouseDown={handleBannerMouseDown}
                    onMouseMove={handleBannerMouseMove}
                    onMouseUp={handleBannerMouseUp}
                    onMouseLeave={handleBannerMouseUp}
                    className={`w-full h-full relative flex items-center justify-center overflow-hidden ${isEditingBanner ? 'cursor-move' : 'cursor-pointer'
                      }`}
                  >
                    {banner ? (
                      <img
                        alt="Banner Preview"
                        src={banner}
                        className="w-full h-full object-cover origin-center pointer-events-none select-none"
                        style={{
                          transform: `scale(${bannerScale}) translate(${bannerX}px, ${bannerY}px)`
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-zinc-100 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                        <span className="material-symbols-outlined text-2xl">image</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Cover Banner</span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    {!isEditingBanner && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1 z-10">
                        <Camera className="w-5 h-5 text-white" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">
                          {banner ? 'Change Cover' : 'Upload Cover'}
                        </span>
                      </div>
                    )}
                  </div>

                  {banner && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                      {isEditingBanner && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBannerScale(1);
                            setBannerX(0);
                            setBannerY(0);
                          }}
                          className="p-1.5 bg-black/70 hover:bg-black/80 text-white rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm"
                          title="Reset Cover Position"
                        >
                          <RotateCcw className="size-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingBanner(!isEditingBanner);
                        }}
                        className={`p-1.5 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm ${isEditingBanner
                            ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                            : 'bg-black/70 hover:bg-black/80 text-white'
                          }`}
                        title={isEditingBanner ? "Finish Editing" : "Adjust Cover Position"}
                      >
                        {isEditingBanner ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Pencil className="size-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBanner(undefined);
                          setIsEditingBanner(false);
                          setBannerScale(1);
                          setBannerX(0);
                          setBannerY(0);
                        }}
                        className="p-1.5 bg-black/70 hover:bg-black/80 text-white rounded-full transition-all flex items-center justify-center cursor-pointer shadow-sm"
                        title="Remove Banner"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={handleBannerFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Avatar Section */}
                <div className="flex items-center gap-5 p-4 bg-[#f9fafb] rounded-xl border border-[#f3f4f6]">
                  <div className="relative shrink-0">
                    <div
                      onClick={handleTriggerUpload}
                      className="group relative w-20 h-20 rounded-full cursor-pointer overflow-hidden border border-[#e5e7eb] bg-white shadow-sm transition-all hover:border-[#111111] flex items-center justify-center"
                    >
                      {profilePic ? (
                        <img
                          alt={name}
                          src={profilePic}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xl font-bold text-[#6b7280]">
                          {name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : 'TM'}
                        </span>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                        <Camera className="w-5 h-5 mb-0.5 text-white" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Change</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <h4 className="text-sm font-semibold text-[#111111]">Profile Photo</h4>
                    <p className="text-xs text-[#6b7280]">Hover over the avatar and click to choose a picture from your device.</p>
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfilePic(undefined)}
                        className="text-xs text-red-600 font-medium hover:underline pt-1 inline-block cursor-pointer"
                      >
                        Remove custom photo
                      </button>
                    )}
                  </div>
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#374151]">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#374151]">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                      placeholder="john@flowstudio.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#374151]">Department / Pod</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                      placeholder="e.g. Leadership, Engineering"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[#374151]">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Role dropdown */}
                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-medium text-[#374151]">Role Designation</label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRoleDropdownOpen(!isRoleDropdownOpen);
                        setRoleSearchQuery('');
                      }}
                      className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] flex items-center justify-between hover:border-[#9ca3af] focus:outline-none focus:border-[#111111] transition-all cursor-pointer"
                      aria-expanded={isRoleDropdownOpen}
                    >
                      <span className="font-medium">{role}</span>
                      <ChevronDown className="size-4 text-[#6b7280]" />
                    </button>

                    {isRoleDropdownOpen && (() => {
                      const filteredRoles = allRoles.filter((item) =>
                        item.role.toLowerCase().includes(roleSearchQuery.toLowerCase())
                      );
                      const exactMatchExists = allRoles.some(
                        (item) => item.role.toLowerCase() === roleSearchQuery.trim().toLowerCase()
                      );

                      return (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg flex flex-col max-h-60 overflow-hidden">
                          <div className="p-2 border-b border-[#e5e7eb] flex items-center gap-1.5 bg-[#f9fafb]">
                            <Search className="size-4 text-[#9ca3af]" />
                            <input
                              type="text"
                              placeholder="Search or create custom role..."
                              value={roleSearchQuery}
                              onChange={(e) => setRoleSearchQuery(e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-xs text-[#111111] placeholder-[#9ca3af] py-0.5"
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto custom-scrollbar py-1 flex-1 max-h-40">
                            {filteredRoles.map((item) => {
                              const isCustom = customRoles.includes(item.role);
                              return (
                                <div
                                  key={item.role}
                                  className={`w-full flex items-center justify-between hover:bg-[#f9fafb] transition-colors ${role === item.role ? 'bg-[#f3f4f6]' : ''}`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRole(item.role);
                                      setIsRoleDropdownOpen(false);
                                      setRoleSearchQuery('');
                                    }}
                                    className="flex-1 px-3 py-2 text-left flex flex-col cursor-pointer focus:outline-none"
                                  >
                                    <span className="text-xs font-semibold text-[#111111]">{item.role}</span>
                                    <span className="text-[11px] text-[#6b7280] leading-tight mt-0.5">{item.desc}</span>
                                  </button>
                                  {isCustom && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeCustomRole(item.role);
                                        if (role === item.role) {
                                          setRole('Designer');
                                        }
                                      }}
                                      aria-label={`Delete custom role ${item.role}`}
                                      className="p-1.5 mr-1.5 text-[#9ca3af] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center animate-fadeIn"
                                    >
                                      <Trash2 className="size-4" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}

                            {filteredRoles.length === 0 && !roleSearchQuery.trim() && (
                              <div className="px-3 py-3 text-center text-xs text-[#9ca3af]">
                                No roles found.
                              </div>
                            )}

                            {roleSearchQuery.trim() && !exactMatchExists && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newRole = roleSearchQuery.trim();
                                  addCustomRole(newRole);
                                  setRole(newRole as TeamRole);
                                  setIsRoleDropdownOpen(false);
                                  setRoleSearchQuery('');
                                }}
                                className="w-full px-3 py-2.5 text-left border-t border-[#f3f4f6] hover:bg-[#f3f4f6] text-[#2563eb] hover:text-[#1d4ed8] transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <Plus className="size-4" />
                                <span className="text-xs font-semibold">Create Custom Role: "{roleSearchQuery.trim()}"</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>


                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#374151]">Biography / Notes</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all resize-none"
                    placeholder="Brief professional background or internal responsibilities..."
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#d1d5db] hover:bg-[#f9fafb] text-[#374151] rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#111111] hover:bg-[#222222] text-white rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Check className="size-3.5" />
                {memberId ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
