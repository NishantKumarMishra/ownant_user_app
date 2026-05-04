import { format } from 'date-fns'

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

export const formatDate = (date: string) => format(new Date(date), 'dd MMM yyyy')

export const formatMonthYear = (my: string) => format(new Date(`${my}-01`), 'MMMM yyyy')

export const maskPhone = (phone: string) => `******${phone.slice(-4)}`

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/
