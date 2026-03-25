import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { cn } from '../../lib/utils';

interface RadioButtonProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  color?: string;
}

const RadioButton = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  RadioButtonProps
>(({ className, color, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer shrink-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      'h-[18px] w-[18px] border bg-white box-content',
      color
        ? 'border-[#CCCCCC] data-[state=checked]:border-[var(--radio-color)]'
        : 'border-[#CCCCCC] data-[state=checked]:border-primary',
      className
    )}
    style={
      color
        ? ({
            '--radio-color': color,
          } as React.CSSProperties)
        : undefined
    }
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <span
        className={cn(
          'block h-[12px] w-[12px] rounded-full border box-content',
          color
            ? 'border-[var(--radio-color)] bg-[var(--radio-color)]'
            : 'border-primary bg-primary'
        )}
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));

RadioButton.displayName = 'RadioButton';

export { RadioButton };

