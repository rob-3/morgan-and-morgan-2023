import { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    children: ReactNode;
  }

export default function Button({
    disabled = false,
    loading = false,
    className = "",
    children,
    ...rest
  }: Props){
    const isDisabled = disabled || loading;

    const defaultstyle = "flex select-none items-center justify-center rounded-full gap-2 px-4 py-2 transition duration-200 ease-out";
    return(
        <button
            disabled = {isDisabled}
            {...rest}
            className= {`${defaultstyle} ${className}`}
        >
        {children}
        </button>
        );
}
