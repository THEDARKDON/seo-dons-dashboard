'use client';

import { useCall } from '@/contexts/CallContext';
import { Button } from '@/components/ui/button';

const keypadButtons = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

const keypadLabels: Record<string, string> = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '0': '+',
  '*': '',
  '#': '',
};

export function DTMFKeypad() {
  const { sendDTMF } = useCall();

  const handleKeyPress = (digit: string) => {
    sendDTMF(digit);
  };

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <p className="text-xs text-center text-muted-foreground mb-3">
        Press digits to navigate phone menus
      </p>
      <div className="grid grid-cols-3 gap-2">
        {keypadButtons.flat().map((digit) => (
          <Button
            key={digit}
            variant="outline"
            className="h-16 flex flex-col items-center justify-center hover:bg-primary/10 active:scale-95 transition-transform"
            onClick={() => handleKeyPress(digit)}
          >
            <span className="text-2xl font-bold">{digit}</span>
            {keypadLabels[digit] && (
              <span className="text-[10px] text-muted-foreground mt-1">
                {keypadLabels[digit]}
              </span>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
