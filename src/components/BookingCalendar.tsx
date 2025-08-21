"use client";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";

type BookingCalendarProps = {
	selectedDate: Date;
	onChange: (date: Date) => void;
};

export default function BookingCalendar({ selectedDate, onChange }: BookingCalendarProps) {
	const [viewDate, setViewDate] = useState<Date>(new Date(selectedDate));

	const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
	const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
	const startWeekday = startOfMonth.getDay();

	const days = useMemo(() => {
		const result: (Date | null)[] = [];
		for (let i = 0; i < startWeekday; i++) result.push(null);
		for (let d = 1; d <= endOfMonth.getDate(); d++) {
			result.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
		}
		return result;
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [viewDate.getFullYear(), viewDate.getMonth()]);

	function isSameDay(a: Date, b: Date) {
		return (
			a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate()
		);
	}

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-center justify-between">
				<button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} aria-label="Previous month">
					<ChevronLeft className="h-4 w-4" />
				</button>
				<div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
					<CalendarDays className="h-4 w-4 text-primary" />
					{viewDate.toLocaleString(undefined, { month: "long", year: "numeric" })}
				</div>
				<button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} aria-label="Next month">
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
			<div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
				{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
					<div key={d} className="py-1">
						{d}
					</div>
				))}
			</div>
			<div className="mt-1 grid grid-cols-7 gap-1">
				{days.map((d, idx) => {
					if (!d)
						return <div key={`empty-${idx}`} className="h-10 rounded-md" />;
					const isSelected = isSameDay(d, selectedDate);
					return (
						<button
							key={d.toISOString()}
							onClick={() => onChange(d)}
							className={`h-10 rounded-md text-sm font-medium transition ${
								isSelected
									? "bg-primary text-white shadow"
								: "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
							}`}
						>
							{d.getDate()}
						</button>
					);
				})}
			</div>
		</div>
	);
}


