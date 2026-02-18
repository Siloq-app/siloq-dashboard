import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

function toast(opts: ToastOptions) {
  const msg = opts.description || opts.title || '';
  if (opts.variant === 'destructive') {
    sonnerToast.error(opts.title || 'Error', { description: opts.description });
  } else {
    sonnerToast.success(opts.title || 'Success', { description: opts.description });
  }
}

export function useToast() {
  return { toast };
}
