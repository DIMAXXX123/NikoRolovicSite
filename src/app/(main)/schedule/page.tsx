'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Edit3, Check, X } from 'lucide-react'

const DAYS = ['Ponedeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak'] as const
const DAY_SHORT = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet'] as const
const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const
const PERIOD_TIMES = [
  '07:30 - 08:15',
  '08:20 - 09:05',
  '09:15 - 10:00',
  '10:05 - 10:50',
  '11:05 - 11:50',
  '11:55 - 12:40',
  '12:45 - 13:30',
]

const SUBJECT_COLORS: Record<string, string> = {
  'Matematika': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Srpski': 'bg-red-500/20 text-red-300 border-red-500/30',
  'Engleski': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Fizika': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'Hemija': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Biologija': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Istorija': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Geografija': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Informatika': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Filozofija': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Muzička': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'Likovna': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'Fizičko': 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  'Latinski': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Sociologija': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Psihologija': 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
}

function getSubjectColor(subject: string): string {
  if (!subject) return ''
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 'bg-primary/15 text-primary border-primary/30'
}

type ScheduleData = Record<string, string>

const DEFAULT_SCHEDULES: Record<string, ScheduleData> = {
  // I razred
  'schedule_1_1': {
    '0-1': 'Matematika', '0-2': 'CSBH', '0-3': 'Engleski', '0-4': 'Biologija', '0-5': 'Fizičko', '0-6': 'Geografija',
    '1-1': 'Fizika', '1-2': 'Matematika', '1-3': 'Hemija', '1-4': 'Istorija', '1-5': 'CSBH', '1-6': 'Likovno',
    '2-1': 'Engleski', '2-2': 'Biologija', '2-3': 'Matematika', '2-4': 'Fizika', '2-5': 'Geografija', '2-6': 'Muzičko',
    '3-1': 'CSBH', '3-2': 'Hemija', '3-3': 'Istorija', '3-4': 'Engleski', '3-5': 'Matematika',
    '4-1': 'Informatika', '4-2': 'Fizičko', '4-3': 'Biologija', '4-4': 'Hemija', '4-5': 'Italijanski',
  },
  'schedule_1_2': {
    '0-1': 'Engleski', '0-2': 'Matematika', '0-3': 'Fizika', '0-4': 'CSBH', '0-5': 'Biologija', '0-6': 'Istorija',
    '1-1': 'Hemija', '1-2': 'Geografija', '1-3': 'Matematika', '1-4': 'Engleski', '1-5': 'Fizičko', '1-6': 'Likovno',
    '2-1': 'Matematika', '2-2': 'CSBH', '2-3': 'Engleski', '2-4': 'Hemija', '2-5': 'Fizika', '2-6': 'Biologija',
    '3-1': 'Istorija', '3-2': 'Fizičko', '3-3': 'Geografija', '3-4': 'Matematika', '3-5': 'CSBH',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Muzičko', '4-4': 'Engleski', '4-5': 'Biologija',
  },
  'schedule_1_3': {
    '0-1': 'CSBH', '0-2': 'Fizika', '0-3': 'Matematika', '0-4': 'Engleski', '0-5': 'Hemija', '0-6': 'Fizičko',
    '1-1': 'Biologija', '1-2': 'Matematika', '1-3': 'Istorija', '1-4': 'Geografija', '1-5': 'Engleski', '1-6': 'Italijanski',
    '2-1': 'Fizika', '2-2': 'CSBH', '2-3': 'Hemija', '2-4': 'Matematika', '2-5': 'Likovno', '2-6': 'Biologija',
    '3-1': 'Engleski', '3-2': 'Informatika', '3-3': 'CSBH', '3-4': 'Fizičko', '3-5': 'Matematika',
    '4-1': 'Geografija', '4-2': 'Istorija', '4-3': 'Fizika', '4-4': 'Muzičko', '4-5': 'Hemija',
  },
  // II razred
  'schedule_2_1': {
    '0-1': 'Matematika', '0-2': 'Engleski', '0-3': 'Likovno', '0-4': 'Geografija', '0-5': 'Italijanski', '0-6': 'Psihologija',
    '1-1': 'Hemija', '1-2': 'Geografija', '1-3': 'Engleski', '1-4': 'Istorija', '1-5': 'Fizičko', '1-6': 'Italijanski',
    '2-1': 'Fizika', '2-2': 'Hemija', '2-3': 'Istorija', '2-4': 'Biologija', '2-5': 'CSBH', '2-6': 'CSBH', '2-7': 'ČOZ',
    '3-1': 'Fizičko', '3-2': 'Matematika', '3-3': 'Matematika', '3-4': 'Psihologija', '3-5': 'CSBH', '3-6': 'Izborni', '3-7': 'Fizika',
    '4-1': 'Izborni', '4-2': 'Izborni', '4-3': 'Engleski', '4-4': 'Matematika', '4-5': 'Biologija', '4-6': 'CSBH',
  },
  'schedule_2_2': {
    '0-1': 'Engleski', '0-2': 'Fizika', '0-3': 'CSBH', '0-4': 'Matematika', '0-5': 'Hemija', '0-6': 'Biologija',
    '1-1': 'Matematika', '1-2': 'Geografija', '1-3': 'Engleski', '1-4': 'Fizičko', '1-5': 'Istorija', '1-6': 'Hemija',
    '2-1': 'Biologija', '2-2': 'Matematika', '2-3': 'Fizika', '2-4': 'CSBH', '2-5': 'Engleski', '2-6': 'Likovno',
    '3-1': 'Hemija', '3-2': 'CSBH', '3-3': 'Matematika', '3-4': 'Geografija', '3-5': 'Fizičko',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Engleski', '4-5': 'Fizika',
  },
  'schedule_2_3': {
    '0-1': 'Hemija', '0-2': 'Matematika', '0-3': 'Engleski', '0-4': 'Biologija', '0-5': 'CSBH', '0-6': 'Fizičko',
    '1-1': 'Istorija', '1-2': 'Fizika', '1-3': 'CSBH', '1-4': 'Matematika', '1-5': 'Engleski', '1-6': 'Geografija',
    '2-1': 'Matematika', '2-2': 'Hemija', '2-3': 'Italijanski', '2-4': 'Fizika', '2-5': 'Biologija', '2-6': 'CSBH',
    '3-1': 'Engleski', '3-2': 'Matematika', '3-3': 'Likovno', '3-4': 'Istorija', '3-5': 'Fizičko',
    '4-1': 'Informatika', '4-2': 'Geografija', '4-3': 'Hemija', '4-4': 'Biologija', '4-5': 'Fizika',
  },
  // III razred
  'schedule_3_1': {
    '0-1': 'Matematika', '0-2': 'Fizika', '0-3': 'Engleski', '0-4': 'Hemija', '0-5': 'CSBH', '0-6': 'Biologija',
    '1-1': 'Istorija', '1-2': 'Matematika', '1-3': 'Geografija', '1-4': 'Fizičko', '1-5': 'Engleski',
    '2-1': 'CSBH', '2-2': 'Hemija', '2-3': 'Matematika', '2-4': 'Fizika', '2-5': 'Biologija', '2-6': 'Filozofija',
    '3-1': 'Engleski', '3-2': 'Sociologija', '3-3': 'Matematika', '3-4': 'CSBH', '3-5': 'Fizičko',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Fizika', '4-4': 'Istorija', '4-5': 'Hemija',
  },
  'schedule_3_2': {
    '0-1': 'Fizika', '0-2': 'Engleski', '0-3': 'Matematika', '0-4': 'CSBH', '0-5': 'Biologija', '0-6': 'Hemija',
    '1-1': 'Matematika', '1-2': 'Istorija', '1-3': 'Fizičko', '1-4': 'Engleski', '1-5': 'Geografija',
    '2-1': 'Filozofija', '2-2': 'Matematika', '2-3': 'Fizika', '2-4': 'Hemija', '2-5': 'CSBH', '2-6': 'Biologija',
    '3-1': 'CSBH', '3-2': 'Engleski', '3-3': 'Sociologija', '3-4': 'Matematika', '3-5': 'Fizičko',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Fizika', '4-5': 'Geografija',
  },
  // IV razred
  'schedule_4_1': {
    '0-1': 'Matematika', '0-2': 'CSBH', '0-3': 'Engleski', '0-4': 'Fizika', '0-5': 'Hemija',
    '1-1': 'Biologija', '1-2': 'Matematika', '1-3': 'Istorija', '1-4': 'Fizičko', '1-5': 'Engleski',
    '2-1': 'Filozofija', '2-2': 'Fizika', '2-3': 'Matematika', '2-4': 'CSBH', '2-5': 'Sociologija',
    '3-1': 'Engleski', '3-2': 'Hemija', '3-3': 'Biologija', '3-4': 'Matematika', '3-5': 'Fizičko',
    '4-1': 'Italijanski', '4-2': 'Geografija', '4-3': 'Informatika', '4-4': 'Istorija',
  },
  'schedule_4_2': {
    '0-1': 'Engleski', '0-2': 'Fizika', '0-3': 'CSBH', '0-4': 'Matematika', '0-5': 'Biologija',
    '1-1': 'Hemija', '1-2': 'Engleski', '1-3': 'Matematika', '1-4': 'Istorija', '1-5': 'Geografija',
    '2-1': 'Matematika', '2-2': 'Fizičko', '2-3': 'Filozofija', '2-4': 'Fizika', '2-5': 'CSBH',
    '3-1': 'Sociologija', '3-2': 'Biologija', '3-3': 'Engleski', '3-4': 'Hemija', '3-5': 'Matematika',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Fizičko', '4-4': 'Istorija',
  },
  // Remaining sections
  'schedule_1_4': {
    '0-1': 'Biologija', '0-2': 'Engleski', '0-3': 'Matematika', '0-4': 'CSBH', '0-5': 'Hemija', '0-6': 'Fizičko',
    '1-1': 'Geografija', '1-2': 'Fizika', '1-3': 'Engleski', '1-4': 'Matematika', '1-5': 'Istorija', '1-6': 'Likovno',
    '2-1': 'Matematika', '2-2': 'CSBH', '2-3': 'Biologija', '2-4': 'Hemija', '2-5': 'Fizika', '2-6': 'Engleski',
    '3-1': 'Italijanski', '3-2': 'Matematika', '3-3': 'Geografija', '3-4': 'Fizičko', '3-5': 'CSBH',
    '4-1': 'Informatika', '4-2': 'Istorija', '4-3': 'Hemija', '4-4': 'Muzičko', '4-5': 'Biologija',
  },
  'schedule_1_5': {
    '0-1': 'CSBH', '0-2': 'Matematika', '0-3': 'Fizika', '0-4': 'Engleski', '0-5': 'Biologija', '0-6': 'Hemija',
    '1-1': 'Engleski', '1-2': 'Istorija', '1-3': 'Matematika', '1-4': 'Geografija', '1-5': 'Fizičko', '1-6': 'CSBH',
    '2-1': 'Hemija', '2-2': 'Biologija', '2-3': 'Engleski', '2-4': 'Fizika', '2-5': 'Matematika', '2-6': 'Likovno',
    '3-1': 'Matematika', '3-2': 'CSBH', '3-3': 'Hemija', '3-4': 'Istorija', '3-5': 'Italijanski',
    '4-1': 'Fizičko', '4-2': 'Geografija', '4-3': 'Informatika', '4-4': 'Biologija', '4-5': 'Muzičko',
  },
  'schedule_1_6': {
    '0-1': 'Fizika', '0-2': 'CSBH', '0-3': 'Engleski', '0-4': 'Matematika', '0-5': 'Geografija', '0-6': 'Biologija',
    '1-1': 'Matematika', '1-2': 'Hemija', '1-3': 'Fizičko', '1-4': 'Engleski', '1-5': 'Likovno', '1-6': 'Istorija',
    '2-1': 'CSBH', '2-2': 'Fizika', '2-3': 'Matematika', '2-4': 'Biologija', '2-5': 'Hemija', '2-6': 'Engleski',
    '3-1': 'Geografija', '3-2': 'Matematika', '3-3': 'Italijanski', '3-4': 'CSBH', '3-5': 'Fizičko',
    '4-1': 'Muzičko', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Fizika', '4-5': 'Hemija',
  },
  'schedule_2_4': {
    '0-1': 'Fizika', '0-2': 'Matematika', '0-3': 'CSBH', '0-4': 'Engleski', '0-5': 'Biologija', '0-6': 'Hemija',
    '1-1': 'Istorija', '1-2': 'Engleski', '1-3': 'Fizičko', '1-4': 'Matematika', '1-5': 'Geografija', '1-6': 'CSBH',
    '2-1': 'Matematika', '2-2': 'Hemija', '2-3': 'Biologija', '2-4': 'Fizika', '2-5': 'Engleski', '2-6': 'Likovno',
    '3-1': 'CSBH', '3-2': 'Matematika', '3-3': 'Italijanski', '3-4': 'Istorija', '3-5': 'Fizičko',
    '4-1': 'Informatika', '4-2': 'Geografija', '4-3': 'Hemija', '4-4': 'Biologija', '4-5': 'Fizika',
  },
  'schedule_2_5': {
    '0-1': 'Engleski', '0-2': 'Hemija', '0-3': 'Matematika', '0-4': 'Fizika', '0-5': 'CSBH', '0-6': 'Biologija',
    '1-1': 'Matematika', '1-2': 'CSBH', '1-3': 'Geografija', '1-4': 'Engleski', '1-5': 'Hemija', '1-6': 'Fizičko',
    '2-1': 'Biologija', '2-2': 'Fizika', '2-3': 'Matematika', '2-4': 'Istorija', '2-5': 'CSBH', '2-6': 'Engleski',
    '3-1': 'Likovno', '3-2': 'Matematika', '3-3': 'Hemija', '3-4': 'Fizičko', '3-5': 'Geografija',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Fizika', '4-4': 'Biologija', '4-5': 'Istorija',
  },
  'schedule_2_6': {
    '0-1': 'Matematika', '0-2': 'Biologija', '0-3': 'Engleski', '0-4': 'Hemija', '0-5': 'Fizičko', '0-6': 'CSBH',
    '1-1': 'Fizika', '1-2': 'Matematika', '1-3': 'Istorija', '1-4': 'CSBH', '1-5': 'Engleski', '1-6': 'Geografija',
    '2-1': 'Engleski', '2-2': 'Hemija', '2-3': 'Biologija', '2-4': 'Matematika', '2-5': 'Fizika', '2-6': 'Likovno',
    '3-1': 'CSBH', '3-2': 'Fizičko', '3-3': 'Matematika', '3-4': 'Hemija', '3-5': 'Italijanski',
    '4-1': 'Istorija', '4-2': 'Informatika', '4-3': 'Geografija', '4-4': 'Biologija', '4-5': 'Engleski',
  },
  'schedule_3_3': {
    '0-1': 'Hemija', '0-2': 'Matematika', '0-3': 'CSBH', '0-4': 'Engleski', '0-5': 'Fizika', '0-6': 'Biologija',
    '1-1': 'Geografija', '1-2': 'Fizičko', '1-3': 'Matematika', '1-4': 'Istorija', '1-5': 'Engleski',
    '2-1': 'Matematika', '2-2': 'Biologija', '2-3': 'Filozofija', '2-4': 'Hemija', '2-5': 'CSBH', '2-6': 'Fizika',
    '3-1': 'Engleski', '3-2': 'Sociologija', '3-3': 'Fizičko', '3-4': 'Matematika', '3-5': 'CSBH',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Fizika', '4-4': 'Istorija', '4-5': 'Hemija',
  },
  'schedule_3_4': {
    '0-1': 'Engleski', '0-2': 'Fizika', '0-3': 'Matematika', '0-4': 'Biologija', '0-5': 'CSBH',
    '1-1': 'Hemija', '1-2': 'Matematika', '1-3': 'Istorija', '1-4': 'Engleski', '1-5': 'Fizičko',
    '2-1': 'CSBH', '2-2': 'Filozofija', '2-3': 'Matematika', '2-4': 'Fizika', '2-5': 'Geografija', '2-6': 'Hemija',
    '3-1': 'Matematika', '3-2': 'Biologija', '3-3': 'Engleski', '3-4': 'Sociologija', '3-5': 'CSBH',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Fizičko', '4-5': 'Fizika',
  },
  'schedule_3_5': {
    '0-1': 'Matematika', '0-2': 'CSBH', '0-3': 'Fizika', '0-4': 'Engleski', '0-5': 'Hemija',
    '1-1': 'Biologija', '1-2': 'Engleski', '1-3': 'Matematika', '1-4': 'Fizičko', '1-5': 'Geografija',
    '2-1': 'Filozofija', '2-2': 'Hemija', '2-3': 'CSBH', '2-4': 'Matematika', '2-5': 'Fizika', '2-6': 'Biologija',
    '3-1': 'Istorija', '3-2': 'Matematika', '3-3': 'Sociologija', '3-4': 'Engleski', '3-5': 'Fizičko',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Hemija', '4-4': 'Geografija', '4-5': 'CSBH',
  },
  'schedule_3_6': {
    '0-1': 'CSBH', '0-2': 'Engleski', '0-3': 'Hemija', '0-4': 'Matematika', '0-5': 'Fizika',
    '1-1': 'Matematika', '1-2': 'Biologija', '1-3': 'Geografija', '1-4': 'CSBH', '1-5': 'Engleski',
    '2-1': 'Fizičko', '2-2': 'Matematika', '2-3': 'Fizika', '2-4': 'Filozofija', '2-5': 'Hemija', '2-6': 'Istorija',
    '3-1': 'Engleski', '3-2': 'CSBH', '3-3': 'Matematika', '3-4': 'Biologija', '3-5': 'Sociologija',
    '4-1': 'Italijanski', '4-2': 'Fizičko', '4-3': 'Informatika', '4-4': 'Fizika', '4-5': 'Geografija',
  },
  'schedule_4_3': {
    '0-1': 'Fizika', '0-2': 'Matematika', '0-3': 'Engleski', '0-4': 'CSBH', '0-5': 'Hemija',
    '1-1': 'Biologija', '1-2': 'Istorija', '1-3': 'Matematika', '1-4': 'Fizičko', '1-5': 'Engleski',
    '2-1': 'Filozofija', '2-2': 'CSBH', '2-3': 'Fizika', '2-4': 'Matematika', '2-5': 'Geografija',
    '3-1': 'Hemija', '3-2': 'Engleski', '3-3': 'Sociologija', '3-4': 'Biologija', '3-5': 'Matematika',
    '4-1': 'Informatika', '4-2': 'Italijanski', '4-3': 'Istorija', '4-4': 'Fizičko',
  },
  'schedule_4_4': {
    '0-1': 'CSBH', '0-2': 'Fizika', '0-3': 'Matematika', '0-4': 'Engleski', '0-5': 'Biologija',
    '1-1': 'Matematika', '1-2': 'Hemija', '1-3': 'Fizičko', '1-4': 'Istorija', '1-5': 'CSBH',
    '2-1': 'Engleski', '2-2': 'Matematika', '2-3': 'Filozofija', '2-4': 'Fizika', '2-5': 'Hemija',
    '3-1': 'Biologija', '3-2': 'Geografija', '3-3': 'Matematika', '3-4': 'Sociologija', '3-5': 'Engleski',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Fizičko', '4-4': 'Istorija',
  },
  'schedule_4_5': {
    '0-1': 'Matematika', '0-2': 'Engleski', '0-3': 'Hemija', '0-4': 'Fizika', '0-5': 'CSBH',
    '1-1': 'Biologija', '1-2': 'Matematika', '1-3': 'Engleski', '1-4': 'Geografija', '1-5': 'Fizičko',
    '2-1': 'Istorija', '2-2': 'Fizika', '2-3': 'Matematika', '2-4': 'CSBH', '2-5': 'Filozofija',
    '3-1': 'Engleski', '3-2': 'Hemija', '3-3': 'Biologija', '3-4': 'Matematika', '3-5': 'Sociologija',
    '4-1': 'Informatika', '4-2': 'Fizičko', '4-3': 'Italijanski', '4-4': 'Istorija',
  },
  'schedule_4_6': {
    '0-1': 'Engleski', '0-2': 'CSBH', '0-3': 'Fizika', '0-4': 'Matematika', '0-5': 'Biologija',
    '1-1': 'Hemija', '1-2': 'Engleski', '1-3': 'Fizičko', '1-4': 'Matematika', '1-5': 'Istorija',
    '2-1': 'Matematika', '2-2': 'Geografija', '2-3': 'CSBH', '2-4': 'Filozofija', '2-5': 'Fizika',
    '3-1': 'Sociologija', '3-2': 'Biologija', '3-3': 'Matematika', '3-4': 'Engleski', '3-5': 'Hemija',
    '4-1': 'Italijanski', '4-2': 'Informatika', '4-3': 'Istorija', '4-4': 'Fizičko',
  },
}

function getStorageKey(classNum: number, sectionNum: number) {
  return `schedule_${classNum}_${sectionNum}`
}

export default function SchedulePage() {
  const [classNum, setClassNum] = useState(1)
  const [sectionNum, setSectionNum] = useState(1)
  const [schedule, setSchedule] = useState<ScheduleData>({})
  const [editing, setEditing] = useState(false)
  const [editCell, setEditCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [activeDay, setActiveDay] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    const today = new Date().getDay()
    setActiveDay(today >= 1 && today <= 5 ? today - 1 : 0)
    
    // Load user's class from profile
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('class_number, section_number')
          .eq('id', user.id)
          .single()
        if (profile) {
          setClassNum(profile.class_number)
          setSectionNum(profile.section_number)
        }
      }
    }
    loadProfile()
  }, [])

  const loadSchedule = useCallback(() => {
    const key = getStorageKey(classNum, sectionNum)
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        setSchedule(JSON.parse(saved))
      } catch {
        setSchedule({})
      }
    } else if (DEFAULT_SCHEDULES[key]) {
      setSchedule(DEFAULT_SCHEDULES[key])
      localStorage.setItem(key, JSON.stringify(DEFAULT_SCHEDULES[key]))
    } else {
      setSchedule({})
    }
  }, [classNum, sectionNum])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  function saveSchedule(data: ScheduleData) {
    const key = getStorageKey(classNum, sectionNum)
    localStorage.setItem(key, JSON.stringify(data))
  }

  function cellKey(day: number, period: number) {
    return `${day}-${period}`
  }

  function startEdit(day: number, period: number) {
    if (!editing) return
    const key = cellKey(day, period)
    setEditCell(key)
    setEditValue(schedule[key] || '')
  }

  function confirmEdit() {
    if (!editCell) return
    const updated = { ...schedule }
    if (editValue.trim()) {
      updated[editCell] = editValue.trim()
    } else {
      delete updated[editCell]
    }
    setSchedule(updated)
    saveSchedule(updated)
    setEditCell(null)
    setEditValue('')
  }

  function cancelEdit() {
    setEditCell(null)
    setEditValue('')
  }

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Raspored</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Raspored časova</p>
        </div>
        <Button
          variant={editing ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setEditing(!editing); cancelEdit() }}
          className="gap-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {editing ? 'Gotovo' : 'Uredi'}
        </Button>
      </div>

      {/* Class selector */}
      <Card className="border-border/30 bg-card/50 backdrop-blur">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Razred</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setClassNum(n)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      classNum === n
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {n}.
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Odjeljenje</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSectionNum(n)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      sectionNum === n
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {n}.
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly overview grid */}
      <Card className="border-border/30 bg-card/50 backdrop-blur overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border/20">
            <h3 className="text-sm font-semibold">Sedmični pregled</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="p-2 text-left text-muted-foreground font-medium w-8">#</th>
                  {DAY_SHORT.map((d, di) => (
                    <th
                      key={d}
                      onClick={() => setActiveDay(di)}
                      className={`p-2 text-center font-medium cursor-pointer transition-colors ${
                        activeDay === di ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period} className="border-b border-border/5">
                    <td className="p-1.5 text-muted-foreground font-medium text-[11px]">{period}</td>
                    {DAYS.map((_, di) => {
                      const subj = schedule[cellKey(di, period)] || ''
                      const color = getSubjectColor(subj)
                      return (
                        <td
                          key={di}
                          className={`p-1 cursor-pointer ${activeDay === di ? 'bg-primary/5' : ''}`}
                          onClick={() => { setActiveDay(di); if (editing) startEdit(di, period) }}
                        >
                          {subj ? (
                            <div className={`px-1.5 py-0.5 rounded text-center truncate border text-[10px] ${color}`}>
                              {subj.length > 5 ? subj.slice(0, 5) + '.' : subj}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground/20">·</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Day tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {DAY_SHORT.map((day, i) => (
          <button
            key={day}
            onClick={() => setActiveDay(i)}
            className={`flex-1 min-w-0 py-2 px-1 rounded-xl text-xs font-medium transition-all ${
              activeDay === i
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Schedule for active day */}
      <Card className="border-border/30 bg-card/50 backdrop-blur overflow-hidden">
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border/20">
            <h3 className="text-sm font-semibold">{DAYS[activeDay]}</h3>
          </div>
          <div className="divide-y divide-border/10">
            {PERIODS.map((period) => {
              const key = cellKey(activeDay, period)
              const subject = schedule[key] || ''
              const isEditing = editCell === key
              const colorClass = getSubjectColor(subject)

              return (
                <div
                  key={period}
                  onClick={() => startEdit(activeDay, period)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    editing ? 'cursor-pointer hover:bg-muted/30 active:bg-muted/50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-sm font-bold text-foreground">{period}.</div>
                    <div className="flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="w-2.5 h-2.5" />
                      {PERIOD_TIMES[period - 1].split(' - ')[0]}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmEdit()
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          placeholder="Naziv predmeta..."
                          className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5 text-sm outline-none border border-border/30 focus:border-primary/50"
                        />
                        <button onClick={confirmEdit} className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : subject ? (
                      <div className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${colorClass}`}>
                        {subject}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground/40 italic">
                        {editing ? 'Dodaj predmet...' : '—'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
