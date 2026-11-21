import { Check, Info, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const ICONS = { success: Check, info: Info, error: AlertTriangle };

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon size={17} aria-hidden="true" />
            <span>{t.message}</span>
            <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
