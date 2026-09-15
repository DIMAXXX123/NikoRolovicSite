/**
 * Role constants shared by server routes and client components. No imports —
 * this file must stay safe to bundle for the browser (api-auth.ts pulls in
 * next/headers and cannot be imported from 'use client' code).
 */

export type AppRole =
  | 'student'
  | 'teacher'
  | 'razredni'
  | 'pedagog'
  | 'direktor'
  | 'moderator'
  | 'admin'
  | 'creator'

/** Roles allowed into the admin area. */
export const STAFF_ROLES: AppRole[] = ['moderator', 'admin', 'creator', 'direktor']

/** Roles allowed to manage accounts, roles and the student roster. */
export const ADMIN_ROLES: AppRole[] = ['admin', 'creator']

/** Roles allowed into the Direktor panel (/direktor, /api/direktor/*). */
export const DIREKTOR_ROLES: AppRole[] = ['direktor', 'admin', 'creator', 'pedagog']

/** Roles allowed to see at-risk pupils WITH names (razredni: own homeroom only). */
export const STUDENT_LIST_ROLES: AppRole[] = ['direktor', 'admin', 'creator', 'pedagog', 'razredni']

/** Roles allowed into the Profesor panel (/nastavnik, /api/nastavnik/*). */
export const NASTAVNIK_ROLES: AppRole[] = ['teacher', 'razredni', 'pedagog', 'direktor', 'admin', 'creator']

/** Roles that may pick another teacher's author in the Profesor panel. */
export const NASTAVNIK_PICKER_ROLES: AppRole[] = ['pedagog', 'direktor', 'admin', 'creator']

/** Roles allowed into the Škola panel (/skola, /api/skola/stats). */
export const SKOLA_ROLES: AppRole[] = ['direktor', 'pedagog', 'razredni', 'admin', 'creator']

/** Roles that may add behaviour notes and import grades/absences. */
export const SKOLA_WRITE_ROLES: AppRole[] = ['direktor', 'pedagog', 'razredni', 'teacher', 'admin', 'creator']

/** Roles allowed into the Aplikacija panel (/aplikacija). */
export const APLIKACIJA_ROLES: AppRole[] = ['direktor', 'admin', 'creator']
