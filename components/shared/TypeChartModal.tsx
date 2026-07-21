import { useState } from "react";

interface ChartTypeOption {
  id: string;
  label: string;
  icon: string;
}

interface TypeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChartType: (chartType: string) => void;
}

const CHART_TYPES: ChartTypeOption[] = [
  { id: "0", label: "Bars", icon: "/perpetual-trading/bar-chart.svg" },
  { id: "1", label: "Candles", icon: "/perpetual-trading/candles.svg" },
  {
    id: "9",
    label: "Hollow candles",
    icon: "/perpetual-trading/hollow-candles.svg",
  },
  { id: "2", label: "Line", icon: "/perpetual-trading/line.svg" },
  { id: "3", label: "Area", icon: "/perpetual-trading/area.svg" },
  {
    id: "10",
    label: "Baseline",
    icon: "/perpetual-trading/base-line.svg",
  },
];

export function TypeChartModal({
  isOpen,
  onClose,
  onSelectChartType,
}: TypeChartModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSelectType = (chartType: string) => {
    setSelectedType(chartType);
    onSelectChartType(chartType);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
      style={{ backgroundColor: "rgba(17, 17, 18, 0.6)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          fixed bottom-0 left-0 right-0 z-50 w-full
          rounded-t-2xl surface-page-background p-4 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
        <h2 className="mb-3 text-center body-subtitle-semibold text-primary-primary">
          Chart type
        </h2>

        <div className="space-y-3">
          {CHART_TYPES.map((chartType) => (
            <button
              key={chartType.id}
              onClick={() => handleSelectType(chartType.id)}
              className={`w-full rounded-lg flex items-center gap-3 transition-colors ${
                selectedType === chartType.id
                  ? "bg-primary-primary text-white"
                  : " text-primary-primary "
              }`}
            >
              <img
                src={chartType.icon}
                width={24}
                height={24}
                alt={chartType.label}
              />
              <span className="text-primary-primary body-subtitle-regular">
                {chartType.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
