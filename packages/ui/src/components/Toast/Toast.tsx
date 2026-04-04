import React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '../../utils/cn.js';

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn('fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96', className)}
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
}

export function Toast({ title, description, variant = 'default' }: ToastProps) {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
  };

  return (
    <ToastPrimitive.Root className={cn('rounded-lg border p-4 shadow-lg', variantStyles[variant])}>
      <ToastPrimitive.Title className="font-medium text-sm">{title}</ToastPrimitive.Title>
      {description && (
        <ToastPrimitive.Description className="text-sm text-gray-500 mt-1">
          {description}
        </ToastPrimitive.Description>
      )}
    </ToastPrimitive.Root>
  );
}
