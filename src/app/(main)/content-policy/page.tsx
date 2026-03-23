export const metadata = {
  title: 'Content Moderation Policy — Gimnazija Niko Rolović',
  description: 'Content moderation guidelines for the Gimnazija Niko Rolović student portal.',
};

export default function ContentPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Content Moderation Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
          <p className="text-gray-400 leading-relaxed">
            The Gimnazija Niko Rolović student portal (&quot;the App&quot;) allows users to share
            photos and other content. This Content Moderation Policy describes how we review, manage,
            and enforce standards for user-generated content to maintain a safe and respectful
            environment for all students.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. Prohibited Content</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            The following types of content are strictly prohibited:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li><strong className="text-gray-300">Violence &amp; threats:</strong> Content depicting or promoting violence, threats, or physical harm against any person.</li>
            <li><strong className="text-gray-300">Hate speech:</strong> Content that attacks, demeans, or discriminates against individuals or groups based on race, ethnicity, nationality, religion, gender, sexual orientation, disability, or any other protected characteristic.</li>
            <li><strong className="text-gray-300">Bullying &amp; harassment:</strong> Content intended to bully, harass, intimidate, or humiliate any individual.</li>
            <li><strong className="text-gray-300">Sexual or explicit content:</strong> Nudity, sexually suggestive material, or content of a sexual nature.</li>
            <li><strong className="text-gray-300">Illegal activities:</strong> Content promoting, encouraging, or depicting illegal activities, including drug use, underage drinking, or vandalism.</li>
            <li><strong className="text-gray-300">Personal information:</strong> Sharing another person&apos;s private information (phone numbers, addresses, etc.) without their consent.</li>
            <li><strong className="text-gray-300">Spam &amp; misleading content:</strong> Repetitive, deceptive, or promotional content unrelated to the school community.</li>
            <li><strong className="text-gray-300">Intellectual property violations:</strong> Content that infringes on copyrights, trademarks, or other intellectual property rights.</li>
            <li><strong className="text-gray-300">Self-harm:</strong> Content that promotes, glorifies, or encourages self-harm or suicide.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. Moderation Process</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            We use a multi-layered approach to content moderation:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li><strong className="text-gray-300">Pre-publication review:</strong> All photos uploaded to the gallery are reviewed by school administrators before being made visible to other users.</li>
            <li><strong className="text-gray-300">User reporting:</strong> Every piece of user-generated content includes a report button (flag icon) that allows any user to flag content for administrator review.</li>
            <li><strong className="text-gray-300">Administrator review:</strong> Reported content is reviewed by school administrators via a dedicated moderation system. Decisions are made within 24 hours of a report.</li>
            <li><strong className="text-gray-300">User blocking:</strong> Users can block other users to stop seeing their content in the gallery and other sections of the App.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Reporting Content</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            If you encounter content that violates this policy:
          </p>
          <ol className="list-decimal list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li>Tap the <strong className="text-gray-300">report button</strong> (flag icon) on the content.</li>
            <li>The report is sent to school administrators for review.</li>
            <li>Administrators will evaluate the report and take action if necessary.</li>
            <li>The reporter&apos;s identity is kept confidential.</li>
          </ol>
          <p className="text-gray-400 leading-relaxed mt-3">
            You may also report content by emailing{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ivaschdima@gmail.com
            </a>{' '}
            with a description of the issue.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Enforcement Actions</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            Depending on the severity and frequency of violations, we may take the following actions:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li><strong className="text-gray-300">Content removal:</strong> The offending content is removed from the App.</li>
            <li><strong className="text-gray-300">Warning:</strong> The user receives a warning about the violation.</li>
            <li><strong className="text-gray-300">Temporary suspension:</strong> The user&apos;s ability to upload content is temporarily restricted.</li>
            <li><strong className="text-gray-300">Account suspension:</strong> For serious or repeated violations, the user&apos;s account may be suspended.</li>
            <li><strong className="text-gray-300">Permanent ban:</strong> In extreme cases, the user&apos;s account may be permanently terminated.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Appeals</h2>
          <p className="text-gray-400 leading-relaxed">
            If you believe your content was removed in error or your account was wrongly suspended,
            you may appeal by contacting{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ivaschdima@gmail.com
            </a>
            . Appeals are reviewed within 48 hours. Include your account email and a description of
            the situation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. AI-Generated Content</h2>
          <p className="text-gray-400 leading-relaxed">
            The App includes AI-powered features for generating educational content (lectures and
            quizzes). AI-generated content is clearly labeled and reviewed by administrators before
            being made available. Users should not rely solely on AI-generated content for academic
            purposes — always verify with official school materials.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">8. Safety of Minors</h2>
          <p className="text-gray-400 leading-relaxed">
            As an educational platform primarily used by minors (ages 15–19), we take extra
            precautions to ensure user safety. Content that could endanger minors is treated with
            the highest severity and removed immediately. We cooperate with school authorities
            and, where required by law, with law enforcement agencies regarding any content that
            may pose a risk to minors.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
          <p className="text-gray-400 leading-relaxed">
            We may update this Content Moderation Policy at any time. Changes will be posted on this
            page with an updated &quot;Last updated&quot; date. Continued use of the App after
            changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
          <p className="text-gray-400 leading-relaxed">
            For questions about this policy or to report urgent content issues, contact us at{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ivaschdima@gmail.com
            </a>
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            See also:{' '}
            <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">Privacy Policy</a>
            {' · '}
            <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">Terms of Use</a>
          </p>
        </div>
      </div>
    </div>
  );
}
