import {
  formatMath,
  parseKeyTerms,
  parseSections,
  parseSummary,
  stripMetadata,
} from '../../lecture-utils'

const RICH_TEXT_CLASS = `text-foreground/90 leading-relaxed text-[15px] max-w-full break-words
  [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:bg-gradient-to-r [&_h1]:from-[#7c5cfc] [&_h1]:to-[#a78bfa] [&_h1]:bg-clip-text [&_h1]:text-transparent
  [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-[#7c5cfc]
  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
  [&_p]:mb-3 [&_p]:leading-7
  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
  [&_li]:mb-1
  [&_strong]:font-bold [&_strong]:text-foreground
  [&_em]:italic
  [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
  [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
  [&_img]:rounded-xl [&_img]:max-w-full
  [&_hr]:border-border/30 [&_hr]:my-6
  [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:rounded-xl [&_pre]:bg-muted/40 [&_pre]:p-3 [&_pre]:text-[13px]
  [&_code]:break-words [&_pre_code]:whitespace-pre [&_pre_code]:break-normal
  [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full [&_table]:w-full
  [&_a]:break-words`

const SECTION_TEXT_CLASS = `text-foreground/90 leading-relaxed text-[15px] max-w-full break-words
  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
  [&_p]:mb-3 [&_p]:leading-7
  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
  [&_li]:mb-1
  [&_strong]:font-bold [&_strong]:text-foreground
  [&_em]:italic
  [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
  [&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
  [&_img]:rounded-xl [&_img]:max-w-full
  [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:rounded-xl [&_pre]:bg-muted/40 [&_pre]:p-3 [&_pre]:text-[13px]
  [&_code]:break-words [&_pre_code]:whitespace-pre [&_pre_code]:break-normal
  [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full [&_table]:w-full
  [&_a]:break-words`

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
      {hasSections ? (
        <div className="space-y-4">
          {sections.map((section, i) => (
            <div key={i} className="border-l-2 border-[#7c5cfc] pl-4">
              {section.heading && (
                <h2 className="text-lg font-semibold text-[#7c5cfc] mb-2">
                  {formatMath(section.heading)}
                </h2>
              )}
              {section.content.includes('<') ? (
                <div
                  className={SECTION_TEXT_CLASS}
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px]">
                  {formatMath(section.content)}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="prose prose-invert prose-sm max-w-none">
          {cleanContent.includes('<') ? (
            <div className={RICH_TEXT_CLASS} dangerouslySetInnerHTML={{ __html: cleanContent }} />
          ) : (
            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-[15px]">
              {formatMath(cleanContent)}
            </div>
          )}
        </div>
      )}

      {keyTerms.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Ključni pojmovi
          </h3>
          <div className="flex flex-wrap gap-2">
            {keyTerms.map((term, i) => (
              <div key={i} className="group relative">
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#7c5cfc]/10 text-[#7c5cfc] text-xs font-medium border border-[#7c5cfc]/20 cursor-help"
                  title={term.definition}
                >
                  {formatMath(term.term)}
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-xl bg-[#0c0c14] border border-[#1a1a2e] text-xs text-foreground/80 max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                  {formatMath(term.definition)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0c0c14] p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📝</span>
            <h3 className="text-sm font-semibold">Rezime</h3>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{formatMath(summary)}</p>
        </div>
      )}
    </div>
  )
}
