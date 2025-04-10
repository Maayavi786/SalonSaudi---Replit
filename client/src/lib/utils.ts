import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, locale: string = "en") {
  const localeObj = locale === "ar" ? ar : undefined;
  return format(date, "d MMMM yyyy", { locale: localeObj });
}
