declare module "react-phone-number-input" {
  import * as React from "react";

  export type Country = string;

  export interface PhoneInputProps {
    country?: Country;
    international?: boolean;
    withCountryCallingCode?: boolean;
    value?: string;
    onChange?: (value?: string) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
  }

  const PhoneInput: React.ComponentType<PhoneInputProps>;
  export function isValidPhoneNumber(value: string): boolean;
  export default PhoneInput;
}

declare module "react-phone-number-input/style.css";
