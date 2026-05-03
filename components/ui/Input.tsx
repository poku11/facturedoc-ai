'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/formatters'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, hint, leftIcon, rightIcon, type = 'text', ...props }, ref) => {
          return (
                  <div className="w-full">
                    {label && (
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                                {props.required && <span className="text-red-500 ml-1">*</span>span>}
                              </label>label>
                          )}
                          <div className="relative">
                            {leftIcon && (
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                  {leftIcon}
                                </div>div>
                                    )}
                                    <input
                                                  type={type}
                                                  ref={ref}
                                                  className={cn(
                                                                  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
                                                                  'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                                                  'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
                                                                  'transition-colors duration-150',
                                                                  leftIcon && 'pl-10',
                                                                  rightIcon && 'pr-10',
                                                                  error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                                                                  className
                                                                )}
                                      {...props}
                                                />
                            {rightIcon && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                  {rightIcon}
                                </div>div>
                                    )}
                          </div>div>
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>p>}
                    {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>p>}
                  </div>div>
                )
    }
  )
  
  Input.displayName = 'Input'
    
    export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
        label?: string
        error?: string
        hint?: string
    }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, error, hint, ...props }, ref) => {
          return (
                  <div className="w-full">
                    {label && (
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                                {props.required && <span className="text-red-500 ml-1">*</span>span>}
                              </label>label>
                          )}
                          <textarea
                                      ref={ref}
                                      className={cn(
                                                    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
                                                    'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                                    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
                                                    'transition-colors duration-150 resize-vertical',
                                                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                                                    className
                                                  )}
                            {...props}
                                    />
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>p>}
                    {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>p>}
                  </div>div>
                )
    }
  )
  
  Textarea.displayName = 'Textarea'
    
    export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
        label?: string
        error?: string
        hint?: string
        options: { value: string; label: string }[]
    }

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, hint, options, ...props }, ref) => {
          return (
                  <div className="w-full">
                    {label && (
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {label}
                                {props.required && <span className="text-red-500 ml-1">*</span>span>}
                              </label>label>
                          )}
                          <select
                                      ref={ref}
                                      className={cn(
                                                    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900',
                                                    'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                                                    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
                                                    'transition-colors duration-150',
                                                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                                                    className
                                                  )}
                            {...props}
                                    >
                            {options.map(opt => (
                                                  <option key={opt.value} value={opt.value}>{opt.label}</option>option>
                                                ))}
                          </select>select>
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>p>}
                    {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>p>}
                  </div>div>
                )
    }
  )
  
  Select.displayName = 'Select'
    
    export default Input</div>
