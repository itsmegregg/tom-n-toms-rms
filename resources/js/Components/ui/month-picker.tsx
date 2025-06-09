import {
  add,
  eachMonthOfInterval,
  endOfYear,
  format,
  isEqual,
  isFuture,
  parse,
  startOfMonth,
  startOfToday,
  startOfYear,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';

interface MonthPickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
}

export default function MonthPicker({
  selected,
  onSelect,
  className,
}: MonthPickerProps) {
  const today = startOfToday();
  const [currentYear, setCurrentYear] = React.useState(
    format(selected || today, 'yyyy')
  );
  const firstDayCurrentYear = parse(currentYear, 'yyyy', new Date());

  const months = eachMonthOfInterval({
    start: startOfYear(firstDayCurrentYear),
    end: endOfYear(firstDayCurrentYear),
  });

  function previousYear() {
    let firstDayPrevYear = add(firstDayCurrentYear, { years: -1 });
    setCurrentYear(format(firstDayPrevYear, 'yyyy'));
  }

  function nextYear() {
    let firstDayNextYear = add(firstDayCurrentYear, { years: 1 });
    setCurrentYear(format(firstDayNextYear, 'yyyy'));
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between">
        <button
          onClick={previousYear}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="font-semibold">
          {format(firstDayCurrentYear, 'yyyy')}
        </div>
        <button
          onClick={nextYear}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {months.map((month, i) => (
          <button
            key={format(month, 'MMM')}
            onClick={() => onSelect?.(month)}
            className={cn(
              'rounded-md p-2 text-sm',
              isEqual(month, selected || today)
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent hover:text-accent-foreground',
              isFuture(month) && 'text-muted-foreground'
            )}
          >
            {format(month, 'MMM')}
          </button>
        ))}
      </div>
    </div>
  );
}
