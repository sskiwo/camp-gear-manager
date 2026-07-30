'use client';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  fontMono?: boolean;
};

export default function ClearableInput({
  value,
  onChange,
  placeholder,
  className = '',
  fontMono = false,
}: Props) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-2 pr-6 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs ${
          fontMono ? 'font-mono' : ''
        }`}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-[10px] font-bold p-0.5 cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
}