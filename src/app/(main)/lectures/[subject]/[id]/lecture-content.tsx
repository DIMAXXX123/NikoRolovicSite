import { CheckCircle2, ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  formatMath,
  parseHomework,
  parseKeyTerms,
  parseSections,
  parseSummary,
  stripHtml,
  stripMetadata,
} from '../../lecture-utils'
import { KeyTermsChips } from './lecture-tabs'
import { HomeworkCard } from './homework-card'

// ---------------------------------------------------------------------------
// Pure helpers shared with the page (server) and the preview page (client).
// ---------------------------------------------------------------------------

const WORDS_PER_MINUTE = 180

/** "~M min čitanja" — from the body word count, metadata blocks excluded. */
export function readingMinutes(content: string): number {
  const words = stripHtml(stripMetadata(content)).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

/** Section headings in reading order — the outline card and the sticky strip use them. */
export function lectureOutline(content: string): string[] {
  return parseSections(stripMetadata(content))
    .filter((s) => s.heading)
    .map((s) => formatMath(s.heading))
}

// ---------------------------------------------------------------------------
// Body styles — one idea per numbered card (§4.2), body 15/700 line-height 1.6.
// ---------------------------------------------------------------------------

const BODY_TEXT = 'text-foreground leading-[1.6] text-[15px] font-bold'

// Raw-HTML sections: h3 sub-headings, green bullets, numbered lists, tables
// that scroll sideways, rounded images. `<blockquote>` — the format's only
// highlight element — becomes the gold "Zapamti" callout.
const HTML_SECTION_CLASS = `${BODY_TEXT}
  [&_h1]:text-[20px] [&_h1]:font-extrabold [&_h1]:leading-[1.25] [&_h1]:text-heading [&_h1]:mb-3 [&_h1]:mt-5
  [&_h2]:text-[20px] [&_h2]:font-extrabold [&_h2]:leading-[1.25] [&_h2]:text-heading [&_h2]:mb-2 [&_h2]:mt-5
  [&_h3]:text-[17px] [&_h3]:font-extrabold [&_h3]:leading-[1.3] [&_h3]:text-heading [&_h3]:mb-2 [&_h3]:mt-4
  [&_p]:mb-3 [&_p:last-child]:mb-0
  [&_ul]:list-none [&_ul]:pl-0 [&_ul]:mb-3 [&_ul]:space-y-2
  [&_ul>li]:relative [&_ul>li]:pl-6
  [&_ul>li]:before:content-[''] [&_ul>li]:before:absolute [&_ul>li]:before:left-1 [&_ul>li]:before:top-[0.55em] [&_ul>li]:before:w-2.5 [&_ul>li]:before:h-2.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-primary
  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-2 [&_ol>li]:pl-1 [&_ol>li]:marker:font-extrabold [&_ol>li]:marker:text-primary-text
  [&_strong]:font-black [&_strong]:text-heading
  [&_em]:italic
  [&_a]:text-secondary [&_a]:font-extrabold [&_a]:underline [&_a]:underline-offset-2
  [&_blockquote]:my-3 [&_blockquote]:rounded-xl [&_blockquote]:border-2 [&_blockquote]:border-[#FFE28A] [&_blockquote]:bg-[#FFF9E0] [&_blockquote]:px-4 [&_blockquote]:py-3 [&_blockquote]:text-[#7A5A00]
  [&_blockquote]:before:content-['Zapamti'] [&_blockquote]:before:block [&_blockquote]:before:mb-1 [&_blockquote]:before:text-[12px] [&_blockquote]:before:font-extrabold [&_blockquote]:before:uppercase [&_blockquote]:before:tracking-[0.04em] [&_blockquote]:before:text-[#C79000]
  [&_blockquote_p]:mb-0
  [&_img]:my-3 [&_img]:rounded-xl [&_img]:max-w-full [&_img]:h-auto
  [&_figure]:my-3 [&_figcaption]:mt-2 [&_figcaption]:text-[13px] [&_figcaption]:text-muted-foreground
  [&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:my-3 [&_table]:border-collapse [&_table]:text-[14px]
  [&_th]:border-2 [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-extrabold [&_th]:text-heading [&_th]:whitespace-nowrap
  [&_td]:border-2 [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top
  [&_hr]:border-t-2 [&_hr]:border-border [&_hr]:my-5
  [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-[13px]
  [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1`

// ---------------------------------------------------------------------------
// Plain-text sections — the body is not markdown, so only what the stored
// text already carries is interpreted: blank-line paragraphs, `- ` / `1. `
// list lines, and the AI's `[SLIKA: opis]` figure placeholders.
// ---------------------------------------------------------------------------

const BULLET_LINE = /^\s*(?:[-•*]|\d+[.)])\s+/
const ORDERED_LINE = /^\s*\d+[.)]\s+/
const FIGURE_LINE = /^\s*\[SLIKA:\s*(.+?)\]\s*$/i

function ListRun({ lines }: { lines: string[] }) {
  const items = lines.map((l) => formatMath(l.replace(BULLET_LINE, '').trim()))
  if (ORDERED_LINE.test(lines[0])) {
    return (
      <ol className="space-y-2 pl-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-primary-light border-2 border-primary-light-border text-primary-text text-[12px] font-extrabold flex items-center justify-center shrink-0 tabular-nums mt-px">
              {i + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    )
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="relative pl-6">
          <span aria-hidden className="absolute left-1 top-[0.55em] w-2.5 h-2.5 rounded-full bg-primary" />
          {item}
        </li>
      ))}
    </ul>
  )
}

/** A blank-line separated block: a figure placeholder, or runs of prose lines and list lines. */
function PlainBlock({ block }: { block: string }) {
  const lines = block.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length === 0) return null

  const figure = lines.length === 1 ? lines[0].match(FIGURE_LINE) : null
  if (figure) {
    return (
      <figure className="my-1 rounded-xl border-2 border-dashed border-border bg-muted px-4 py-5 flex flex-col items-center gap-2 text-center">
        <ImageIcon className="w-7 h-7 text-disabled" strokeWidth={2.4} />
        <figcaption className="text-[13px] font-bold text-muted-foreground">{formatMath(figure[1])}</figcaption>
      </figure>
    )
  }

  // Group consecutive lines by kind so "intro line + bullets" renders as
  // a paragraph followed by a list instead of one pre-wrapped lump.
  const runs: { list: boolean; lines: string[] }[] = []
  for (const line of lines) {
    const list = BULLET_LINE.test(line)
    const last = runs[runs.length - 1]
    if (last && last.list === list) last.lines.push(line)
    else runs.push({ list, lines: [line] })
  }

  return (
    <div className="space-y-2">
      {runs.map((run, i) =>
        run.list ? (
          <ListRun key={i} lines={run.lines} />
        ) : (
          <p key={i} className="whitespace-pre-wrap">
            {formatMath(run.lines.join('\n'))}
          </p>
        )
      )}
    </div>
  )
}

function PlainText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).filter((b) => b.trim().length > 0)
  return (
    <div className={`${BODY_TEXT} space-y-3`}>
      {blocks.map((block, i) => (
        <PlainBlock key={i} block={block} />
      ))}
    </div>
  )
}

function SectionBody({ text }: { text: string }) {
  if (text.includes('<')) {
    return <div className={HTML_SECTION_CLASS} dangerouslySetInnerHTML={{ __html: text }} />
  }
  return <PlainText text={text} />
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

/**
 * Renders the lecture body on the server — the heaviest part of the page never
 * reaches the browser as JavaScript. Each `## ` section becomes a numbered
 * card carrying `data-lecture-section` so the client shell can track
 * reading progress without re-parsing the content.
 *
 * Homework (the HOMEWORK block) is not a section: the gold card opens the
 * body so nobody misses it, and a compact repeat closes it right above the
 * practice CTA. `lectureId` keys the per-device "done" flag.
 */
export function LectureContent({ content, lectureId }: { content: string; lectureId: string }) {
  const cleanContent = stripMetadata(content)
  const keyTerms = parseKeyTerms(content)
  const summary = parseSummary(content)
  const homework = parseHomework(content)
  const sections = parseSections(cleanContent)
  const hasSections = sections.some((s) => s.heading)

  return (
    <div className="space-y-4">
      {homework && <HomeworkCard lectureId={lectureId} homework={homework} />}

      {hasSections ? (
        sections.map((section, i) => (
          <Card
            key={i}
            id={`dio-${i + 1}`}
            data-lecture-section={i}
            className="gap-3 overflow-visible scroll-mt-[120px]"
          >
            {section.heading && (
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-[13px] font-extrabold flex items-center justify-center shrink-0 tabular-nums shadow-[0_2px_0_var(--color-primary-dark)]">
                  {i + 1}
                </span>
                <h2 className="text-[20px] font-extrabold leading-[1.25] text-heading pt-1">
                  {formatMath(section.heading)}
                </h2>
              </div>
            )}
            <SectionBody text={section.content} />
          </Card>
        ))
      ) : (
        <Card data-lecture-section={0} className="overflow-visible scroll-mt-[120px]">
          <SectionBody text={cleanContent} />
        </Card>
      )}

      {keyTerms.length > 0 && <KeyTermsChips terms={keyTerms} />}

      {summary && (
        <Card
          data-lecture-summary=""
          className="gap-2 border-primary-light-border bg-[#F4FFEA] shadow-[0_2px_0_var(--color-primary-light-border)] overflow-visible"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary-text" strokeWidth={2.6} />
            <h3 className="text-[17px] font-extrabold leading-[1.3] text-heading">Sažetak</h3>
          </div>
          <p className="text-[15px] font-bold text-foreground leading-[1.6] whitespace-pre-wrap">
            {formatMath(summary)}
          </p>
        </Card>
      )}

      {homework && <HomeworkCard lectureId={lectureId} homework={homework} compact />}
    </div>
  )
}
