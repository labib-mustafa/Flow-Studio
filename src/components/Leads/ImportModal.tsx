import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { X, Upload, Check, AlertCircle, FileText, ArrowRight, Plus } from 'lucide-react';
import { Lead } from '../../stores/leadStore';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (leads: Omit<Lead, 'id' | 'last_updated_at' | 'timeline'>[]) => void;
  onAddManual: () => void;
}

const FIELD_DEFAULTS = {
  name: 'New Lead',
  company: 'Draft Company',
  email: '',
  phone: '',
  status: 'New' as const,
  socials: '',
  location: '',
  estimated_value: 0,
  source: 'Imported',
  notes_summary: 'Imported lead.',
  tags: [] as string[]
};

const FIELD_LABELS = {
  name: 'Lead Name *',
  company: 'Company',
  email: 'Email',
  phone: 'Phone',
  estimated_value: 'Estimated Value ($)',
  source: 'Lead Source',
  location: 'Location',
  socials: 'Social Links',
  notes_summary: 'Notes Summary',
  tags: 'Tags (comma separated)'
};

const MAPPING_GUESSES: Record<string, string[]> = {
  name: ['name', 'full name', 'lead name', 'contact name', 'person', 'contact'],
  company: ['company', 'firm', 'organization', 'company name', 'business'],
  email: ['email', 'e-mail', 'email address', 'mail'],
  phone: ['phone', 'telephone', 'mobile', 'phone number', 'contact number'],
  estimated_value: ['value', 'estimated value', 'deal value', 'worth', 'amount', 'budget', 'price'],
  source: ['source', 'lead source', 'origin', 'channel', 'medium'],
  location: ['location', 'address', 'city', 'country', 'state'],
  socials: ['socials', 'social', 'social link', 'instagram', 'linkedin', 'twitter', 'facebook'],
  notes_summary: ['notes', 'summary', 'description', 'details', 'notes summary', 'comment'],
  tags: ['tags', 'categories', 'labels', 'tag']
};

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, onAddManual }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFile(null);
      setHeaders([]);
      setParsedData([]);
      setMappings({});
      setPreviewRows([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields) {
            setHeaders(results.meta.fields);
            setParsedData(results.data);
            autoGuessMappings(results.meta.fields);
            setStep(2);
          }
        },
        error: (err) => {
          alert('Error parsing CSV file: ' + err.message);
        }
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          
          if (json.length > 0) {
            const detectedHeaders = Object.keys(json[0] as object);
            setHeaders(detectedHeaders);
            setParsedData(json);
            autoGuessMappings(detectedHeaders);
            setStep(2);
          } else {
            alert('The Excel file appears to be empty.');
          }
        } catch (err: any) {
          alert('Error parsing Excel file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      alert('Unsupported file format. Please upload a CSV or Excel file.');
      setFile(null);
    }
  };

  const autoGuessMappings = (detectedHeaders: string[]) => {
    const newMappings: Record<string, string> = {};
    
    Object.keys(FIELD_LABELS).forEach(field => {
      const guesses = MAPPING_GUESSES[field] || [];
      const matchedHeader = detectedHeaders.find(header => 
        guesses.some(guess => header.toLowerCase().replace(/[^a-z0-9]/g, '') === guess.toLowerCase().replace(/[^a-z0-9]/g, ''))
      );
      if (matchedHeader) {
        newMappings[field] = matchedHeader;
      } else {
        newMappings[field] = '';
      }
    });

    setMappings(newMappings);
  };

  const handleMappingChange = (field: string, header: string) => {
    setMappings(prev => ({ ...prev, [field]: header }));
  };

  const handleApplyMapping = () => {
    // Generate mapped rows
    const mapped = parsedData.map(row => {
      const item: any = {};
      Object.keys(FIELD_DEFAULTS).forEach(key => {
        const mappedHeader = mappings[key];
        const rawValue = mappedHeader ? row[mappedHeader] : undefined;

        if (key === 'estimated_value') {
          const num = parseFloat(String(rawValue || '0').replace(/[^0-9.]/g, ''));
          item[key] = isNaN(num) ? 0 : num;
        } else if (key === 'tags') {
          item[key] = rawValue 
            ? String(rawValue).split(',').map(t => t.trim()).filter(Boolean)
            : [];
        } else {
          item[key] = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : (FIELD_DEFAULTS as any)[key];
        }
      });
      return item;
    });

    setPreviewRows(mapped);
    setStep(3);
  };

  const handleConfirmImport = () => {
    onImport(previewRows);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans select-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Import Leads</h3>
            <p className="text-xs text-slate-400">Seed your leads directory with dummy data, custom files, or manual entries</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0 flex items-center gap-6 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
            <span>Upload</span>
          </div>
          <ArrowRight className="size-3.5 text-slate-300" />
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
            <span>Map Fields</span>
          </div>
          <ArrowRight className="size-3.5 text-slate-300" />
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
            <span>Verify & Import</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Manual Entry Option */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                    <Plus className="size-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">Add Lead Manually</h5>
                    <p className="text-[11px] text-slate-400">Prefer entering a single prospect's details directly?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddManual();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  Create Single Lead
                </button>
              </div>

              <div className="relative flex items-center my-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="shrink-0 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Or bulk import spreadsheet</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/10 hover:bg-slate-50/40 transition-all gap-3 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-600 shadow-sm transition-colors">
                  <Upload className="size-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-700">Drag & Drop spreadsheet here</h4>
                  <p className="text-xs text-slate-400 mt-1.5">Supports CSV, XLSX, or XLS files up to 5MB</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
                <AlertCircle className="size-4 shrink-0" />
                <span>Map headers from <strong>{file?.name}</strong> to the target Fields. Matches are guessed automatically!</span>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <div className="grid grid-cols-2 px-4 py-2.5 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <span>Lead Field</span>
                  <span>Spreadsheet Column</span>
                </div>
                {Object.entries(FIELD_LABELS).map(([field, label]) => (
                  <div key={field} className="grid grid-cols-2 px-4 py-3 items-center text-sm">
                    <span className="font-semibold text-slate-700">{label}</span>
                    <select
                      value={mappings[field] || ''}
                      onChange={e => handleMappingChange(field, e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/20 cursor-pointer"
                    >
                      <option value="">-- Skip Field --</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-medium">
                <Check className="size-4 shrink-0" />
                <span>Ready to import <strong>{previewRows.length}</strong> leads from your file! Verify preview below:</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Company</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                    {previewRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{row.name}</td>
                        <td className="px-4 py-2.5">{row.company}</td>
                        <td className="px-4 py-2.5">{row.email || 'N/A'}</td>
                        <td className="px-4 py-2.5 text-blue-600">${row.estimated_value?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewRows.length > 10 && (
                <p className="text-[10px] text-slate-400 font-semibold italic text-center">Showing first 10 rows of {previewRows.length} total rows</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={() => {
              if (step === 2) setStep(1);
              else if (step === 3) setStep(2);
              else onClose();
            }}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors shadow-sm cursor-pointer"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step === 2 && (
            <button
              onClick={handleApplyMapping}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Continue
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="size-4" />
              Confirm Import
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
