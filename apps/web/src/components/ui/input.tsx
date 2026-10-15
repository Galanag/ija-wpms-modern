import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[#3d3a32] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5 rounded-lg border bg-white text-[#1a1a18] placeholder-[#8a8578]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#123a28]/20 focus:border-[#123a28]
            disabled:bg-[#f5f3ed] disabled:cursor-not-allowed
            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-[#ddd8ca] hover:border-[#c4c0b4]'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
