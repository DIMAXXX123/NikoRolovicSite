// §4.2 card look on the original semantic <section> elements.
const SECTION_CLASS =
  'flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-4 shadow-[0_2px_0_var(--color-border)]';

// §4.8 chip, 44px tall so the footer links are real tap targets.
const SEE_ALSO_CHIP =
  'inline-flex h-11 items-center rounded-xl border-2 border-border bg-background px-3.5 text-[12px] font-extrabold uppercase tracking-[0.04em] text-secondary shadow-[0_2px_0_var(--color-border)] transition-[transform,box-shadow] duration-[80ms] hover:bg-muted active:translate-y-[2px] active:shadow-none';

export const metadata = {
  title: 'Terms of Use — Gimnazija Niko Rolović',
  description: 'Terms of Use for the Gimnazija Niko Rolović student portal and mobile application.',
};

export default function TermsPage() {
  return (
    <div className="animate-fade-in pb-8">
      <div className="max-w-3xl mx-auto space-y-3">
        <h1 className="text-[26px] leading-[1.2] font-extrabold tracking-[-0.01em] text-heading">Terms of Use</h1>
        <p className="text-[13px] leading-[1.4] font-bold text-muted-foreground mb-3">Last updated: March 2026</p>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">1. Acceptance of Terms</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            By accessing or using the Gimnazija Niko Rolović student portal and mobile application
            (&quot;the App&quot;), you agree to be bound by these Terms of Use. If you do not agree
            to these terms, you must not use the App. For users under the age of 18, a parent or
            legal guardian must review and accept these terms on your behalf.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">2. Description of Service</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            The App is an educational platform for students of Gimnazija Niko Rolović in Bar,
            Montenegro. It provides access to school schedules, grades, news, events, lectures,
            quizzes, a photo gallery, and interactive features. The App is developed and maintained
            by the student development team.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">3. Eligibility</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            The App is intended for current students, teachers, and staff of Gimnazija Niko Rolović.
            Users must be at least 13 years of age to create an account. Users between the ages of
            13 and 18 must have the consent of a parent or legal guardian to use the App.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">4. User Accounts</h2>
          <ul className="list-disc pl-5 marker:text-muted-foreground text-[15px] leading-[1.5] font-bold text-foreground space-y-1.5">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You must not share your account with others or use another person&apos;s account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">5. User-Generated Content</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            The App allows users to upload photos and other content (&quot;User Content&quot;). By
            uploading User Content, you:
          </p>
          <ul className="list-disc pl-5 marker:text-muted-foreground text-[15px] leading-[1.5] font-bold text-foreground space-y-1.5">
            <li>Confirm that you own or have the right to share the content.</li>
            <li>Grant us a non-exclusive, royalty-free license to display the content within the App.</li>
            <li>Agree that all User Content is subject to moderation and may be removed without notice.</li>
            <li>Accept responsibility for ensuring your content does not violate any laws or rights of others.</li>
          </ul>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">6. Prohibited Conduct</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">You agree not to:</p>
          <ul className="list-disc pl-5 marker:text-muted-foreground text-[15px] leading-[1.5] font-bold text-foreground space-y-1.5">
            <li>Upload or share content that is offensive, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</li>
            <li>Bully, harass, or intimidate other users.</li>
            <li>Impersonate any person or entity.</li>
            <li>Use the App for any illegal purpose.</li>
            <li>Attempt to gain unauthorized access to the App or its systems.</li>
            <li>Interfere with the proper functioning of the App.</li>
            <li>Upload content that infringes on intellectual property rights of others.</li>
            <li>Collect or store personal data about other users without their consent.</li>
          </ul>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">7. Content Moderation</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            All user-uploaded content is reviewed by school administrators before being made publicly
            visible. We reserve the right to remove any content that violates these terms or our{' '}
            <a href="/content-policy" className="font-extrabold text-secondary underline underline-offset-4">
              Content Moderation Policy
            </a>
            . Users who repeatedly violate content guidelines may have their accounts suspended or
            terminated.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">8. Reporting &amp; Blocking</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            Users can report inappropriate content using the report button (flag icon) available on
            photos, news posts, and other user-generated content. Users may also block other users
            to prevent seeing their content. Reports are reviewed by administrators and appropriate
            action is taken within 24 hours.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">9. Intellectual Property</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            The App, including its design, features, code, and original content, is the property of
            the development team and Gimnazija Niko Rolović. You may not copy, modify, distribute,
            or create derivative works based on the App without prior written consent.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">10. Disclaimer of Warranties</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            The App is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
            any kind, either express or implied. We do not guarantee that the App will be
            uninterrupted, error-free, or free of harmful components. School schedule, grade, and
            event data is provided for informational purposes and may not always be up to date.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">11. Limitation of Liability</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            To the maximum extent permitted by applicable law, the development team and Gimnazija
            Niko Rolović shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages arising out of or related to your use of the App.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">12. Account Termination</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            We may suspend or terminate your account at any time if you violate these Terms of Use.
            You may delete your account at any time through Profile → Settings → Delete Account.
            Upon termination, your right to use the App ceases immediately.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">13. Changes to Terms</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            We reserve the right to update these Terms of Use at any time. Continued use of the App
            after changes are posted constitutes acceptance of the revised terms. Material changes
            will be communicated through in-app notifications.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">14. Governing Law</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            These Terms of Use are governed by the laws of Montenegro. Any disputes arising from
            these terms shall be resolved in the courts of Bar, Montenegro.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-[20px] leading-[1.25] font-extrabold text-heading">15. Contact</h2>
          <p className="text-[15px] leading-[1.5] font-bold text-foreground">
            For questions about these Terms of Use, please contact us at{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="font-extrabold text-secondary underline underline-offset-4"
            >
              ivaschdima@gmail.com
            </a>
          </p>
        </section>

        <div className="mt-6 pt-6 border-t-2 border-border space-y-2.5">
          <p className="text-[12px] leading-none font-extrabold uppercase tracking-[0.04em] text-muted-foreground px-1">See also:</p>
          <div className="flex flex-wrap gap-2">
            <a href="/privacy" className={SEE_ALSO_CHIP}>Privacy Policy</a>
            <a href="/content-policy" className={SEE_ALSO_CHIP}>Content Moderation Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
