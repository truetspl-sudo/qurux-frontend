"use client";

import { useState } from "react";

// Timing 10:00 AM se 9:30 PM tak (30-min slots)
const morningSlots = [
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
];

const afternoonSlots = [
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
];

const eveningSlots = [
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:30 PM",
  "9:00 PM",
  "9:30 PM",
];

type TimeSlotProps = {
  value: string;
  onChange: (slot: string) => void;
};

export default function TimeSlotPicker({
  value,
  onChange,
}: TimeSlotProps) {
  const [activeTab, setActiveTab] = useState<
    "morning" | "afternoon" | "evening"
  >("morning");

  const tabs = [
    { key: "morning" as const, label: "Morning", icon: "🌅" },
    { key: "afternoon" as const, label: "Afternoon", icon: "☀️" },
    { key: "evening" as const, label: "Evening", icon: "🌆" },
  ];

  const slots = {
    morning: morningSlots,
    afternoon: afternoonSlots,
    evening: eveningSlots,
  };

  return (
    <div>
      <p className="mb-3 font-semibold text-gray-800">
        Select Time Slot
      </p>

      {/* Tab Buttons */}
      <div className="mb-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-pink-600 text-white shadow-md"
                : "bg-white text-gray-700 shadow-sm hover:bg-pink-50"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {slots[activeTab].map((slot) => (
          <button
            key={slot}
            type="button"
            onClick={() => onChange(slot)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              value === slot
                ? "border-pink-500 bg-pink-600 text-white shadow-md"
                : "border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  );
}
