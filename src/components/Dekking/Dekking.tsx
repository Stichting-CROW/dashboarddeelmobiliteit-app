/**
 * Footnote for "vrijwel alle deelvoertuigen": an asterisk that opens a short
 * explanation of which vehicles the dashboard shows. Hidden by default.
 */

interface DekkingSterProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const DekkingSter = ({ isOpen, onToggle }: DekkingSterProps) => (
  <button
    type="button"
    className="-mx-1.5 -my-2 px-1.5 py-2 align-super text-xs font-semibold text-theme-blue hover:underline"
    aria-expanded={isOpen}
    aria-label="Toelichting: welke deelvoertuigen toont het dashboard?"
    onClick={onToggle}
  >
    *
  </button>
);

export const DekkingToelichting = () => (
  <p className="text-xs text-gray-500 leading-relaxed">
    * Alle deelvoertuigen zijn welkom op de kaart, maar van sommige
    deelvoertuigen biedt de aanbieder nog geen data aan.
  </p>
);
