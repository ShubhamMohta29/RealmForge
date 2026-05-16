export type ContentRating = 'under16' | 'teen' | 'adult'

export function getContentRating(dateOfBirth: string | null | undefined): ContentRating {
  if (!dateOfBirth) return 'adult'
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return 'adult'
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--
  if (age < 16) return 'under16'
  if (age < 18) return 'teen'
  return 'adult'
}
