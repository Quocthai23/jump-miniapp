interface InfoModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export function InfoModal({
  isOpen,
  title,
  description,
  onClose,
}: InfoModalProps) {
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
          rounded-t-2xl surface-page-background p-6 shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
        `}
      >
        {/* <div className="mb-4 flex justify-center">
          <div className="h-1 w-12 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div> */}

        <h2 className="mb-2 text-center body-subtitle-semibold text-primary-primary">
          {title}
        </h2>

        <p className="mb-6 text-center body-body-regular text-primary-secondary">
          {description}
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-full button-primary-container py-3 body-subtitle-semibold text-white"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
