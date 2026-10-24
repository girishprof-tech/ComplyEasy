import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string };

/** A labelled text input using the app's `.field` styling. */
export function Field({ id, label, ...inputProps }: InputProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...inputProps} />
    </div>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string };

export function TextAreaField({ id, label, ...props }: TextAreaProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} {...props} />
    </div>
  );
}
