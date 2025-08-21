"use client";
import { useState } from "react";
import { User, Phone, Send } from "lucide-react";

type BookingFormProps = {
	selectedCourt: string | null;
	selectedDate: Date;
	selectedTime: string | null;
	selectedDuration: number;
};

export default function BookingForm({ selectedCourt, selectedDate, selectedTime, selectedDuration }: BookingFormProps) {
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const canSubmit = Boolean(selectedCourt && selectedTime && name.trim() && phone.trim());

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!canSubmit) return;
		const dateIso = selectedDate.toISOString().slice(0, 10);
		const res = await fetch("/api/bookings", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				date: dateIso,
				court: selectedCourt,
				start: selectedTime,
				duration: selectedDuration,
				name,
				phone,
			}),
		});
		const j = await res.json().catch(() => ({}));
		if (!res.ok) {
			alert(j.error || `Failed to create booking (${res.status})`);
			return;
		}
		alert("Booking created");
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<h4 className="text-sm font-semibold text-slate-800">Booking Details</h4>
			<div className="mt-3 grid grid-cols-1 gap-3">
				<div className="text-xs text-slate-500">
					<span className="font-medium text-slate-700">Summary: </span>
					<span>
						{selectedCourt ? selectedCourt : "Select a court"} • {selectedTime ? selectedTime : "Select a time"} • {selectedDuration} min • {selectedDate.toLocaleDateString()}
					</span>
				</div>
				<label className="block">
					<span className="mb-1 block text-xs font-medium text-slate-700">Name</span>
					<div className="relative">
						<User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
					</div>
				</label>
				<label className="block">
					<span className="mb-1 block text-xs font-medium text-slate-700">Phone</span>
					<div className="relative">
						<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
					</div>
				</label>
				<button type="submit" disabled={!canSubmit} className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-white text-sm font-semibold shadow-sm transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.99]">
					<Send className="mr-2 h-4 w-4" /> Submit
				</button>
			</div>
		</form>
	);
}


