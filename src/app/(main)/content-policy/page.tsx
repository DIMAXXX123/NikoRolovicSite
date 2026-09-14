import { Card } from '@/components/ui/card';

// §4.8 chip, 44px tall so the footer links are real tap targets.
const SEE_ALSO_CHIP =
  'inline-flex h-11 items-center rounded-xl border-2 border-border bg-background px-3.5 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] hover:bg-muted active:translate-y-[2px] active:shadow-none';

export const metadata = {
  title: 'Content Moderation Policy — Gimnazija Niko Rolović',
  description: 'Content moderation guidelines for the Gimnazija Niko Rolović student portal.',
};

export default function ContentPolicyPage() {
  return (
    <div className="animate-fade-in pb-8">
      <div className="max-w-3xl mx-auto space-y-3">
        <h1 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">Content Moderation Policy</h1>
        <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground mb-3">Last updated: March 2026</p>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">1. Overview</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            The Gimnazija Niko Rolović student portal (&quot;the App&quot;) allows users to share
            photos and other content. This Content Moderation Policy describes how we review, manage,
            and enforce standards for user-generated content to maintain a safe and respectful
            environment for all students.
          </p>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">2. Prohibited Content</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            The following types of content are strictly prohibited:
          </p>
          <ul className="list-disc pl-5 marker:text-muted-foreground text-[15px] leading-[1.5] font-bold text-foreground space-y-1.5">
            <li><strong className="font-extrabold text-heading">Violence &amp; threats:</strong> Content depicting or promoting violence, threats, or physical harm against any person.</li>
            <li><strong className="font-extrabold text-heading">Hate speech:</strong> Content that attacks, demeans, or discriminates against individuals or groups based on race, ethnicity, nationality, religion, gender, sexual orientation, disability, or any other protected characteristic.</li>
            <li><strong className="font-extrabold text-heading">Bullying &amp; harassment:</strong> Content intended to bully, harass, intimidate, or humiliate any individual.</li>
            <li><strong className="font-extrabold text-heading">Sexual or explicit content:</strong> Nudity, sexually suggestive material, or content of a sexual nature.</li>
            <li><strong className="font-extrabold text-heading">Illegal activities:</strong> Content promoting, encouraging, or depicting illegal activities, including drug use, underage drinking, or vandalism.</li>
            <li><strong className="font-extrabold text-heading">Personal information:</strong> Sharing another person&apos;s private information (phone numbers, addresses, etc.) without their consent.</li>
            <li><strong className="font-extrabold text-heading">Spam &amp; misleading content:</strong> Repetitive, deceptive, or promotional content unrelated to the school community.</li>
            <li><strong className="font-extrabold text-heading">Intellectual property violations:</strong> Content that infringes on copyrights, trademarks, or other intellectual property rights.</li>
            <li><strong className="font-extrabold text-heading">Self-harm:</strong> Content that promotes, glorifies, or encourages self-harm or suicide.</li>
          </ul>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">3. Moderation Process</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            We use a multi-layered approach to content moderation:
          </p>
          <ul className="list-disc pl-5 marker:text-muted-foreground text-[15px] leading-[1.5] font-bold text-foreground space-y-1.5">
            <li><strong className="font-extrabold text-heading">Pre-publication review:</strong> All photos uploaded to the gallery are reviewed by school administrators before being made visible to other users.</li>
            <li><strong className="font-extrabold text-heading">User reporting:</strong> Every piece of user-generated content includes a report button (flag icon) that allows any user to flag content for administrator review.</li>
            <li><strong className="font-extrabold text-heading">Administrator review:</strong> Reported content is reviewed by school administrators via a dedicated moderation system. Decisions are made within 24 hours of a report.</li>
            <li><strong className="font-extrabold text-heading">User blocking:</strong> Users can block other users to stop seeing their content in the gallery and other sections of the App.</li>
          </ul>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">4. Reporting Content</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            If you encounter content that violates this policy:
          </p>
          <ol className="list-decimal list-inside text-[15px] leading-[1.5] font-bold text-foreground space-y-1.5">
            <li>Tap the <strong className="font-extrabold text-heading">report button</strong> (flag icon) on the content.</li>
            <li>The report is sent to school administrators for review.</li>
            <li>Administrators will evaluate the report and take action if necessary.</li>
            <li>The reporter&apos;s identity is kept confidential.</li>
          </ol>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            You may also report content by emailing{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="font-extrabold text-secondary underline underline-offset-4"
            >
              ivaschdima@gmail.com
            </a>{' '}
            with a description of the issue.
          </p>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">5. Enforcement Actions</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            Depending on the severity and frequency of violations, we may take the following actions:
          </p>
          <ul className="list-disc pl-5 marker:text-muted-foreground text-[15px] leading-[1.5] font-bold text-foreground space-y-1.5">
            <li><strong className="font-extrabold text-heading">Content removal:</strong> The offending content is removed from the App.</li>
            <li><strong className="font-extrabold text-heading">Warning:</strong> The user receives a warning about the violation.</li>
            <li><strong className="font-extrabold text-heading">Temporary suspension:</strong> The user&apos;s ability to upload content is temporarily restricted.</li>
            <li><strong className="font-extrabold text-heading">Account suspension:</strong> For serious or repeated violations, the user&apos;s account may be suspended.</li>
            <li><strong className="font-extrabold text-heading">Permanent ban:</strong> In extreme cases, the user&apos;s account may be permanently terminated.</li>
          </ul>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">6. Appeals</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            If you believe your content was removed in error or your account was wrongly suspended,
            you may appeal by contacting{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="font-extrabold text-secondary underline underline-offset-4"
            >
              ivaschdima@gmail.com
            </a>
            . Appeals are reviewed within 48 hours. Include your account email and a description of
            the situation.
          </p>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">7. AI-Generated Content</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            The App includes AI-powered features for generating educational content (lectures and
            quizzes). AI-generated content is clearly labeled and reviewed by administrators before
            being made available. Users should not rely solely on AI-generated content for academic
            purposes — always verify with official school materials.
          </p>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">8. Safety of Minors</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            As an educational platform primarily used by minors (ages 15–19), we take extra
            precautions to ensure user safety. Content that could endanger minors is treated with
            the highest severity and removed immediately. We cooperate with school authorities
            and, where required by law, with law enforcement agencies regarding any content that
            may pose a risk to minors.
          </p>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">9. Changes to This Policy</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            We may update this Content Moderation Policy at any time. Changes will be posted on this
            page with an updated &quot;Last updated&quot; date. Continued use of the App after
            changes constitutes acceptance of the revised policy.
          </p>
        </Card>

        <Card className="gap-3">
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">10. Contact</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            For questions about this policy or to report urgent content issues, contact us at{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="font-extrabold text-secondary underline underline-offset-4"
            >
              ivaschdima@gmail.com
            </a>
          </p>
        </Card>

        <div className="mt-6 pt-6 border-t-2 border-border space-y-2.5">
          <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground px-1">See also</p>
          <div className="flex flex-wrap gap-2">
            <a href="/privacy" className={SEE_ALSO_CHIP}>Privacy Policy</a>
            <a href="/terms" className={SEE_ALSO_CHIP}>Terms of Use</a>
          </div>
        </div>
      </div>
    </div>
  );
}
