'use client'

import { StatsPage } from '../_components/blocks'
import { LearningView } from './learning-view'

export default function DirektorUcenje() {
  return <StatsPage>{(s) => <LearningView s={s} />}</StatsPage>
}
