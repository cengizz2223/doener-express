'use client';

interface Props {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  count?: number;
}

const SIZE = {
  sm: { circle: 'w-7 h-7 text-xs',  font: 'text-[10px]' },
  md: { circle: 'w-10 h-10 text-sm', font: 'text-xs'     },
  lg: { circle: 'w-14 h-14 text-xl', font: 'text-sm'     },
};

export default function WorkerAvatar({ name, color, size = 'md', showName = false, count }: Props) {
  const s = SIZE[size];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <div
          className={`${s.circle} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-offset-2 ring-offset-zinc-900 shadow-md`}
          style={{ backgroundColor: color, boxShadow: `0 0 0 2px ${color}60` }}
        >
          {name[0]?.toUpperCase()}
        </div>
        {count !== undefined && count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-white text-zinc-900 text-[10px] font-black rounded-full flex items-center justify-center px-0.5 leading-none shadow">
            {count}
          </span>
        )}
      </div>
      {showName && (
        <span className={`font-semibold leading-none ${s.font}`} style={{ color }}>
          {name}
        </span>
      )}
    </div>
  );
}
