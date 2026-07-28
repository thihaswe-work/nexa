'use client';

import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets: { label: string; days: number }[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  function handlePreset(days: number) {
    onChange({ from: new Date(Date.now() - days * 86400000), to: new Date() });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-[260px] justify-start text-left font-normal')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(value.from, 'MMM d, yyyy')} – {format(value.to, 'MMM d, yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex border-b">
          <div className="flex flex-col gap-1 p-3">
            {presets.map((p) => (
              <Button
                key={p.days}
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => handlePreset(p.days)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className="border-l p-3">
            <Calendar
              mode="range"
              selected={{ from: value.from, to: value.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) onChange({ from: range.from, to: range.to });
              }}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
