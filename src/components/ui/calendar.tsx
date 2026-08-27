import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Bill } from '@/types';
import { formatCurrency, getCategoryIcon } from '@/lib/utils';

interface CalendarProps {
  bills: Bill[];
  onDateClick?: (date: Date, bills: Bill[]) => void;
}

export function Calendar({ bills, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getBillsForDate = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return bills.filter(bill => {
      const billDate = new Date(bill.dueDate).toISOString().split('T')[0];
      return billDate === dateStr;
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  const isOverdue = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
  };

  const renderDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 p-1 border border-[#D5ECEB] bg-gray-50" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayBills = getBillsForDate(day);
      const hasOverdue = isOverdue(day) && dayBills.length > 0;
      const isPaid = dayBills.every(b => b.status === 'PAID');

      days.push(
        <div
          key={day}
          onClick={() => dayBills.length > 0 && onDateClick?.(new Date(year, month, day), dayBills)}
          className={`h-24 p-1 border border-[#D5ECEB] transition-colors ${
            dayBills.length > 0
              ? 'bg-[#F1FAFA] hover:bg-[#DFF5F2] cursor-pointer'
              : 'bg-[#F7F8F5]'
          } ${hasOverdue && !isPaid ? 'border-[#DC2626] border-2' : ''}`}
        >
          <div className={`text-sm font-semibold mb-1 ${
            isToday(day)
              ? 'bg-[#078D88] text-white rounded-full w-6 h-6 flex items-center justify-center'
              : isOverdue(day) && !isPaid
              ? 'text-[#DC2626]'
              : 'text-[#071936]'
          }`}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayBills.slice(0, 2).map((bill) => (
              <div
                key={bill.id}
                className={`text-xs px-1 py-0.5 rounded truncate ${
                  bill.status === 'PAID'
                    ? 'bg-green-100 text-green-800 line-through'
                    : bill.status === 'OVERDUE'
                    ? 'bg-red-100 text-red-800'
                    : bill.status === 'PARTIALLY_PAID'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-[#DFF5F2] text-[#078D88]'
                }`}
              >
                {getCategoryIcon(bill.category)} {bill.name}
              </div>
            ))}
            {dayBills.length > 2 && (
              <div className="text-xs text-[#4B5D7A] pl-1">
                +{dayBills.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="bg-[#F7F8F5] rounded-xl border border-[#D5ECEB] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#D5ECEB] bg-[#F1FAFA]">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-[#DFF5F2] transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-[#071936]" />
        </button>
        <h3 className="text-lg font-bold text-[#071936]">
          {monthNames[month]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-[#DFF5F2] transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-[#071936]" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-[#D5ECEB]">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-semibold text-[#4B5D7A] bg-[#F1FAFA] border-r border-[#D5ECEB] last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {renderDays()}
      </div>
    </div>
  );
}

interface MiniCalendarProps {
  bills: Bill[];
}

export function MiniCalendar({ bills }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const hasBillOnDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return bills.some(b => new Date(b.dueDate).toISOString().split('T')[0] === dateStr);
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`e-${i}`} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <div
          key={day}
          className={`relative w-6 h-6 flex items-center justify-center text-xs rounded-full
            ${hasBillOnDay(day) ? 'bg-[#078D88] text-white' : 'text-[#071936]'}
          `}
        >
          {day}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="p-3 bg-[#F7F8F5] rounded-lg border border-[#D5ECEB]">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 hover:bg-[#F1FAFA] rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{monthNames[month]} {year}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-[#F1FAFA] rounded">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {renderDays()}
      </div>
    </div>
  );
}
