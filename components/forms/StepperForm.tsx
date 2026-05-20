'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Stepper, 
  StepperDescription, 
  StepperItem, 
  StepperSeparator, 
  StepperTitle, 
  StepperTrigger,
  useStepper 
} from '@/components/ui/stepper';
import { Check, Circle, Dot, MapPin, ShoppingBag, BookOpen, Code2, Briefcase, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchemas = [
  z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
  }),
  z.object({
    password: z.string().min(2, 'Password must be at least 2 characters').max(50, 'Password must be less than 50 characters'),
    confirmPassword: z.string(),
  }).refine(
    (values) => {
      return values.password === values.confirmPassword;
    },
    {
      message: 'Passwords must match!',
      path: ['confirmPassword'],
    },
  ),
  z.object({
    favoriteDrink: z.union([z.literal('coffee'), z.literal('tea'), z.literal('soda')]),
  }),
];

const steps = [
  {
    step: 1,
    title: 'Your details',
    description: 'Provide your name and email',
  },
  {
    step: 2,
    title: 'Your password',
    description: 'Choose a password',
  },
  {
    step: 3,
    title: 'Your Favorite Drink',
    description: 'Choose a drink',
  },
];

interface StepperFormProps {
  onSubmit?: (values: any) => void;
}

export default function StepperForm({ onSubmit }: StepperFormProps) {
  const { currentStep, nextStep, prevStep, isNextDisabled, isPrevDisabled } = useStepper(1, steps.length);
  
  const currentSchema = formSchemas[currentStep - 1];
  const form = useForm({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      favoriteDrink: undefined,
    },
  });

  const getStepState = (stepNumber: number): 'inactive' | 'active' | 'completed' => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'inactive';
  };

  // Debug logging
  console.log('Current step:', currentStep);
  steps.forEach((step, index) => {
    const state = getStepState(step.step);
    console.log(`Step ${step.step}: ${state} (isLast: ${index === steps.length - 1})`);
  });

  const handleSubmit = (values: any) => {
    if (currentStep === steps.length) {
      const allValues = form.getValues();
      onSubmit?.(allValues);
      toast('You submitted the following values:', {
        description: (
          <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
            <code className="text-white">{JSON.stringify(allValues, null, 2)}</code>
          </pre>
        ),
      });
    } else {
      form.trigger().then((isValid: boolean) => {
        if (isValid) {
          nextStep();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => {
          const state = getStepState(step.step);
          return (
            <React.Fragment key={step.step}>
              <div className={`flex items-center justify-center rounded-full transition-all duration-300 w-7 h-7 ${
                state === 'completed' || state === 'active' 
                  ? 'border border-[#FBBF23] bg-[linear-gradient(135deg,#FCD34E_0%,#FBBF23_100%)] text-[#78350E] ring-4 ring-amber-100 dark:ring-amber-800' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
              }`}>
                <span className="text-xs font-semibold">
                  {state === 'completed' ? '✓' : step.step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                  state === 'completed' 
                    ? 'bg-[#FBBF23]' 
                    : 'bg-slate-200 dark:bg-slate-600'
                }`} style={{minWidth: '32px'}}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="px-8 py-7 min-h-[340px]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {steps[currentStep - 1].description}
          </p>
          
          <div className="space-y-4">
            {currentStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 bg-emerald-50 border-emerald-500 shadow-sm"
                >
                  <div className="flex-shrink-0 rounded-lg p-2 bg-emerald-100">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm mb-0.5 text-emerald-700">Local / Service Business</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">Contractors, agencies, healthcare, restaurants — serving customers in a geographic area.</p>
                  </div>
                  <div className="ml-auto flex-shrink-0 mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-[#FBBF23] flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-[#78350E]" />
                    </div>
                  </div>
                </button>
                
                <button
                  type="button"
                  className="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <div className="flex-shrink-0 rounded-lg p-2 bg-blue-100">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm mb-0.5 text-slate-800 dark:text-slate-200">E-Commerce</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">Online stores selling physical or digital products to customers anywhere.</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  className="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <div className="flex-shrink-0 rounded-lg p-2 bg-amber-100">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm mb-0.5 text-slate-800 dark:text-slate-200">Content / Blog</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">Publishers, media sites, blogs, and content-driven sites monetized by ads or affiliates.</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  className="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <div className="flex-shrink-0 rounded-lg p-2 bg-violet-100">
                    <Code2 className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm mb-0.5 text-slate-800 dark:text-slate-200">SaaS / Software</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">Subscription software, apps, and platforms targeting business or consumer users.</p>
                  </div>
                </button>
                
                <button
                  type="button"
                  className="flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <div className="flex-shrink-0 rounded-lg p-2 bg-slate-100">
                    <Briefcase className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm mb-0.5 text-slate-800 dark:text-slate-200">Other</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">Non-profit, portfolio, community site, or anything that doesn't fit the above.</p>
                  </div>
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 3 && (
              <FormField
                control={form.control}
                name="favoriteDrink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Drink</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a drink" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="coffee">Coffee</SelectItem>
                          <SelectItem value="tea">Tea</SelectItem>
                          <SelectItem value="soda">Soda</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            disabled={isPrevDisabled} 
            variant="ghost" 
            size="sm" 
            type="button" 
            onClick={prevStep}
            className="text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            {currentStep !== steps.length ? (
              <Button 
                type="button" 
                onClick={() => form.trigger().then((isValid: boolean) => isValid && nextStep())}
                className="min-w-[140px]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="min-w-[140px]">
                Submit
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
