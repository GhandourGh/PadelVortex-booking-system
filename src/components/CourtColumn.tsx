"use client";
import { CircleCheck, CircleX } from "lucide-react";

type Slot = {
	start: string; // 09:00
	available: boolean;
};

type CourtColumnProps = {
	courtName: string;
	slots: Slot[];
	selectedSlot: string | null;
	onSelect: (slot: string) => void;
};

export default function CourtColumn({ courtName, slots, selectedSlot, onSelect }: CourtColumnProps) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<h4 className="text-sm font-semibold text-slate-800">{courtName}</h4>
			<div className="mt-3 grid grid-cols-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
				{slots.map((s) => {
					const isSelected = s.start === selectedSlot;
					return (
						<button
							key={s.start}
							disabled={!s.available}
							onClick={() => onSelect(s.start)}
							className={`inline-flex items-center justify-between rounded-md border px-3 py-2 text-sm font-medium transition ${
								!s.available
									? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
								: isSelected
									? "border-emerald-600 bg-emerald-50 text-emerald-700"
									: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
							}`}
						>
							<span>{s.start}</span>
							{s.available ? (
								<CircleCheck className="h-4 w-4 text-emerald-600" />
							) : (
								<CircleX className="h-4 w-4 text-slate-400" />
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}


