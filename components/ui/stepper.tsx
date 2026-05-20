'use client';

import React, { useState } from 'react';
import { Check, Circle, Dot } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface Step {
  step: number;
  title: string;
  description: string;
}

interface StepperProps {
  children: React.ReactNode;
  className?: string;
}

interface StepperItemProps {
  step: number;
  state: 'inactive' | 'active' | 'completed';
  children: React.ReactNode;
  isLast?: boolean;
}

interface StepperTriggerProps {
  state: 'inactive' | 'active' | 'completed';
  children: React.ReactNode;
  disabled?: boolean;
  asChild?: boolean;
  className?: string;
}

interface StepperSeparatorProps {
  completed?: boolean;
  className?: string;
}

interface StepperTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface StepperDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

function StepperTrigger({ state, children, disabled, asChild, className }: StepperTriggerProps) {
  return (
    <Button
      variant={state === 'completed' || state === 'active' ? 'default' : 'outline'}
      size="icon"
      className={cn(
        "z-10 rounded-full shrink-0",
        state === 'active' && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        className
      )}
      disabled={disabled}
      style={{
        zIndex: 10,
        borderRadius: '50%',
        flexShrink: 0,
        ...(state === 'active' && {
          ring: '2px solid hsl(var(--ring))',
          ringOffset: '2px',
          ringOffsetColor: 'hsl(var(--background))'
        })
      }}
    >
      {children}
    </Button>
  );
}

function StepperSeparator({ completed, className }: StepperSeparatorProps) {
  return (
    <div
      className={cn(
        "absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-0.5 shrink-0 rounded-full bg-muted",
        completed && "bg-primary",
        className
      )}
      style={{
        position: 'absolute',
        left: 'calc(50% + 20px)',
        right: 'calc(-50% + 10px)',
        top: '20px',
        height: '2px',
        backgroundColor: completed ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
        borderRadius: '9999px'
      }}
    />
  );
}

function StepperTitle({ children, className }: StepperTitleProps) {
  return (
    <div className={cn("text-sm font-semibold transition lg:text-base", className)}>
      {children}
    </div>
  );
}

function StepperDescription({ children, className }: StepperDescriptionProps) {
  return (
    <div className={cn("sr-only text-xs text-muted-foreground transition md:not-sr-only lg:text-sm", className)}>
      {children}
    </div>
  );
}

function StepperItem({ step, state, children, isLast }: StepperItemProps) {
  return (
    <div className="relative flex w-full flex-col items-center justify-center">
      {!isLast && <StepperSeparator completed={state === 'completed'} />}
      {children}
    </div>
  );
}

export function Stepper({ children, className }: StepperProps) {
  return <div className={cn("block w-full", className)}>{children}</div>;
}

export function useStepper(initialStep = 1, totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const isNextDisabled = currentStep >= totalSteps;
  const isPrevDisabled = currentStep <= 1;

  return {
    currentStep,
    nextStep,
    prevStep,
    goToStep,
    isNextDisabled,
    isPrevDisabled,
  };
}

export { StepperItem, StepperTrigger, StepperSeparator, StepperTitle, StepperDescription };
