const fs = require('fs');
const path = 'src/components/Team/EditMemberModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Refs
content = content.replace(
  "const bannerInputRef = useRef<HTMLInputElement>(null);",
  "const bannerInputRef = useRef<HTMLInputElement>(null);\n\n  const isDragging = useRef(false);\n  const dragStart = useRef({ x: 0, y: 0 });\n  const picStart = useRef({ x: 0, y: 0 });"
);

// 2. Update useEffect
content = content.replace(
  "        setBanner(member.banner);\n      }\n    }\n  }, [isOpen, memberId, members]);",
  "        setBanner(member.banner);\n        setProfilePicScale(member.profilePicScale ?? 1);\n        setProfilePicX(member.profilePicX ?? 0);\n        setProfilePicY(member.profilePicY ?? 0);\n      }\n    }\n  }, [isOpen, memberId, members]);"
);

// 3. Update handleSubmit
content = content.replace(
  "      activeFocus: activeFocus.trim(),\n      profilePic,\n      banner\n    });",
  "      activeFocus: activeFocus.trim(),\n      profilePic,\n      banner,\n      profilePicScale,\n      profilePicX,\n      profilePicY\n    });"
);

// 4. Add Mouse Events to image wrapper
const imgSection = `<div className="absolute inset-x-0 top-0 h-[316px] w-full overflow-hidden">
                      <img
                        src={profilePic}
                        alt={name || 'Preview'}
                        className="w-full h-full object-cover origin-center"
                        style={{
                          transform: \`scale(\${profilePicScale}) translate(\${profilePicX}px, \${profilePicY}px)\`
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>`;

const newImgSection = `<div className="absolute inset-x-0 top-0 h-[316px] w-full overflow-hidden cursor-move"
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
                      onWheel={(e) => {
                        const zoomSensitivity = 0.005;
                        setProfilePicScale(prev => Math.max(0.1, Math.min(5, prev - e.deltaY * zoomSensitivity)));
                      }}
                    >
                      <img
                        src={profilePic}
                        alt={name || 'Preview'}
                        className="w-full h-full object-cover origin-center pointer-events-none"
                        style={{
                          transform: \`scale(\${profilePicScale}) translate(\${profilePicX}px, \${profilePicY}px)\`
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>`;
content = content.replace(imgSection, newImgSection);

// 5. Remove sliders
const startIndex = content.indexOf('{/* Sizing Controls */}');
const endIndex = content.indexOf('</div>\n\n              {/* Right Column: Form Inputs */}');

if (startIndex !== -1 && endIndex !== -1) {
  const newSizingControls = `{/* Sizing Controls */}
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
                      Drag the image above to pan, or scroll to zoom in and out.
                    </p>
                  </div>
                )}
              `;
  content = content.substring(0, startIndex) + newSizingControls + content.substring(endIndex);
}

fs.writeFileSync(path, content);
console.log('Patched correctly');
