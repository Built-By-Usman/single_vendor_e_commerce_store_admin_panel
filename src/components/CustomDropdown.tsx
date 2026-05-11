import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Option {
  id: string | number;
  name: string;
}

interface Props {
  options: Option[];
  value: string | number;
  onChange: (val: string | number) => void;
  placeholder?: string;
  name?: string;
}

export default function CustomDropdown({ options, value, onChange, placeholder = "Select an option", name }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options?.find(o => o.id.toString() === value?.toString());
  const filteredOptions = options?.filter(o => o.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="relative w-full" ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <div 
        className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-brand-primary/20 cursor-pointer shadow-sm hover:border-slate-300 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm font-medium ${selectedOption ? 'text-slate-900' : 'text-slate-500'}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 9999,
          }}
          className="mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 origin-top"
        >
          <div className="p-2 border-b border-slate-50 shrink-0">
            <div className="flex items-center px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
              <input
                type="text"
                className="bg-transparent border-none outline-none text-sm w-full"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-60 p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500 text-center italic">No results found</div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.id}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer rounded-lg hover:bg-slate-50 transition-colors ${option.id.toString() === value?.toString() ? 'bg-brand-primary/5 text-brand-primary font-bold' : 'text-slate-700'}`}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {option.name}
                  {option.id.toString() === value?.toString() && <CheckIcon className="w-4 h-4 shrink-0 stroke-[3]" />}
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
