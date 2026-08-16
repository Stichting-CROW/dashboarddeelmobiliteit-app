import { ReactNode } from 'react';

interface DemoWidgetCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Card wrapper that labels one demo widget on the features page. */
function DemoWidgetCard({ title, description, children, footer }: DemoWidgetCardProps) {
  return (
    <div className="DemoWidgetCard rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2">
        {/* Inline sizing, because .Overlay h3 styling would otherwise win */}
        <h3 className="font-bold" style={{ margin: 0, fontSize: '1rem', lineHeight: '1.5rem' }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500" style={{ margin: 0 }}>
            {description}
          </p>
        )}
      </div>

      {children}

      {footer && <div className="mt-2">{footer}</div>}

      <div className="mt-2 text-xs text-gray-400">Voorbeeld met demodata</div>
    </div>
  );
}

export default DemoWidgetCard;
