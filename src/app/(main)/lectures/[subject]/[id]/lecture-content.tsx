import { Card } from '@/components/ui/card'
import {
  formatMath,
  parseKeyTerms,
  parseSections,
  parseSummary,
  stripMetadata,
} from '../../lecture-utils'

const RICH_TEXT_CLASS = `text-foreground leading-[1.5] text-[15px] font-bold
  [&_h1]:text-[20px] [&_h1]:font-extrabold [&_h1]:leading-[1.25] [&_h1]:text-heading [&_h1]:mb-3 [&_h1]:mt-6
  [&_h2]:text-[20px] [&_h2]:font-extrabold [&_h2]:leading-[1.25] [&_h2]:text-heading [&_h2]:mb-2 [&_h2]:mt-5
  [&_h3]:text-[17px] [&_h3]:font-extrabold [&_h3]:leading-[1.3] [&_h3]:text-heading [&_h3]:mb-2 [&_h3]:mt-4
  [&_p]:mb-3
  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
  [&_li]:mb-1
  [&_strong]:font-black [&_strong]:text-heading
  [&_em]:italic
  [&_a]:text-secondary [&_a]:font-extrabold [&_a]:underline [&_a]:underline-offset-2
  [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
  [&_img]:rounded-xl [&_img]:max-w-full
  [&_hr]:border-t-2 [&_hr]:border-border [&_hr]:my-6`

const SECTION_TEXT_CLASS = `text-foreground leading-[1.5] text-[15px] font-bold
  [&_h3]:text-[17px] [&_h3]:font-extrabold [&_h3]:leading-[1.3] [&_h3]:text-heading [&_h3]:mb-2 [&_h3]:mt-4
  [&_p]:mb-3
  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
  [&_li]:mb-1
  [&_strong]:font-black [&_strong]:text-heading
  [&_em]:italic
  [&_a]:text-secondary [&_a]:font-extrabold [&_a]:underline [&_a]:underline-offset-2
  [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
  [&_img]:rounded-xl [&_img]:max-w-full`

const PLAIN_TEXT_CLASS = 'whitespace-pre-wrap text-foreground leading-[1.5] text-[15px] font-bold'

/**
 * Renders the lecture body on the server — the heaviest part of the page never
 * reaches the browser as JavaScript.
 */
export function LectureContent({ content }: { content: string }) {
  const cleanContent = stripMetadata(content)
  const keyTerms = parseKeyTerms(content)
  const summary = parseSummary(content)
  const sections = parseSections(cleanContent)
  const hasSections = sections.some((s) => s.heading)

  return (
    <div className="space-y-4">
      <Card className="gap-0 overflow-visible">
        {hasSections ? (
          <div className="space-y-5">
            {sections.map((section, i) => (
              <div key={i}>
                {section.heading && (
                  <h2 className="text-[20px] font-extrabold leading-[1.25] text-heading mb-2">
                    {formatMath(section.heading)}
                  </h2>
                )}
                {section.content.includes('<') ? (
                  <div
                    className={SECTION_TEXT_CLASS}
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                ) : (
                  <div className={PLAIN_TEXT_CLASS}>{formatMath(section.content)}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-none">
            {cleanContent.includes('<') ? (
              <div className={RICH_TEXT_CLASS} dangerouslySetInnerHTML={{ __html: cleanContent }} />
            ) : (
              <div className={PLAIN_TEXT_CLASS}>{formatMath(cleanContent)}</div>
            )}
          </div>
        )}
      </Card>

      {keyTerms.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[12px] font-extrabold text-muted-foreground uppercase tracking-[0.04em]">
            Ključni pojmovi
          </h3>
          <div className="flex flex-wrap gap-2">
            {keyTerms.map((term, i) => (
              <div key={i} className="group relative">
                <span
                  className="inline-flex items-center h-10 px-3.5 rounded-xl border-2 border-secondary-light-border bg-secondary-light text-secondary text-[13px] font-extrabold shadow-[0_2px_0_var(--color-secondary-light-border)] cursor-help"
                  title={term.definition}
                >
                  {formatMath(term.term)}
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-card border-2 border-border shadow-[0_2px_0_var(--color-border)] text-[13px] font-extrabold text-foreground max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {formatMath(term.definition)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary && (
        <Card className="gap-2 border-primary-light-border bg-[#F4FFEA] shadow-[0_2px_0_var(--color-primary-light-border)]">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <h3 className="text-[17px] font-extrabold leading-[1.3] text-heading">Rezime</h3>
          </div>
          <p className="text-[15px] font-bold text-foreground leading-[1.5]">{formatMath(summary)}</p>
        </Card>
      )}
    </div>
  )
}
