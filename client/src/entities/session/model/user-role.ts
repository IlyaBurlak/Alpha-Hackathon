export const USER_ROLES = {
  entrepreneur: 'entrepreneur',
  employee: 'employee',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]
