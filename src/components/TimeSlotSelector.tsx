"use client";
import { Clock } from "lucide-react";

type TimeSlotSelectorProps = {
	selectedDuration: number; // minutes
	onChange: (minutes: number) => void;
};

export default function TimeSlotSelector({ selectedDuration, onChange }: TimeSlotSelectorProps) {
	const options = [
		{ label: "1h", minutes: 60 },
		{ label: "1h 30m", minutes: 90 },
		{ label: "2h", minutes: 120 },
	];

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
				<Clock className="h-4 w-4 text-primary" /> Duration
			</div>
			<div className="mt-3 flex flex-wrap gap-2">
				{options.map((opt) => (
					<button
						key={opt.minutes}
						onClick={() => onChange(opt.minutes)}
						className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition ${
							selectedDuration === opt.minutes
								? "border-primary bg-primary/10 text-primary"
								: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
						}`}
					>
						{opt.label}
					</button>
				))}
			</div>
		</div>
	);
}


