export const metadata = {
  title: 'Terms of Use — Gimnazija Niko Rolović',
  description: 'Terms of Use for the Gimnazija Niko Rolović student portal and mobile application.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-400 leading-relaxed">
            By accessing or using the Gimnazija Niko Rolović student portal and mobile application
            (&quot;the App&quot;), you agree to be bound by these Terms of Use. If you do not agree
            to these terms, you must not use the App. For users under the age of 18, a parent or
            legal guardian must review and accept these terms on your behalf.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
          <p className="text-gray-400 leading-relaxed">
            The App is an educational platform for students of Gimnazija Niko Rolović in Bar,
            Montenegro. It provides access to school schedules, grades, news, events, lectures,
            quizzes, a photo gallery, and interactive features. The App is developed and maintained
            by the student development team.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. Eligibility</h2>
          <p className="text-gray-400 leading-relaxed">
            The App is intended for current students, teachers, and staff of Gimnazija Niko Rolović.
            Users must be at least 13 years of age to create an account. Users between the ages of
            13 and 18 must have the consent of a parent or legal guardian to use the App.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. User Accounts</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You must not share your account with others or use another person&apos;s account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. User-Generated Content</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            The App allows users to upload photos and other content (&quot;User Content&quot;). By
            uploading User Content, you:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li>Confirm that you own or have the right to share the content.</li>
            <li>Grant us a non-exclusive, royalty-free license to display the content within the App.</li>
            <li>Agree that all User Content is subject to moderation and may be removed without notice.</li>
            <li>Accept responsibility for ensuring your content does not violate any laws or rights of others.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Prohibited Conduct</h2>
          <p className="text-gray-400 leading-relaxed mb-3">You agree not to:</p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
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

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. Content Moderation</h2>
          <p className="text-gray-400 leading-relaxed">
            All user-uploaded content is reviewed by school administrators before being made publicly
            visible. We reserve the right to remove any content that violates these terms or our{' '}
            <a href="/content-policy" className="text-blue-400 hover:text-blue-300 underline">
              Content Moderation Policy
            </a>
            . Users who repeatedly violate content guidelines may have their accounts suspended or
            terminated.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">8. Reporting &amp; Blocking</h2>
          <p className="text-gray-400 leading-relaxed">
            Users can report inappropriate content using the report button (flag icon) available on
            photos, news posts, and other user-generated content. Users may also block other users
            to prevent seeing their content. Reports are reviewed by administrators and appropriate
            action is taken within 24 hours.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">9. Intellectual Property</h2>
          <p className="text-gray-400 leading-relaxed">
            The App, including its design, features, code, and original content, is the property of
            the development team and Gimnazija Niko Rolović. You may not copy, modify, distribute,
            or create derivative works based on the App without prior written consent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">10. Disclaimer of Warranties</h2>
          <p className="text-gray-400 leading-relaxed">
            The App is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
            any kind, either express or implied. We do not guarantee that the App will be
            uninterrupted, error-free, or free of harmful components. School schedule, grade, and
            event data is provided for informational purposes and may not always be up to date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">11. Limitation of Liability</h2>
          <p className="text-gray-400 leading-relaxed">
            To the maximum extent permitted by applicable law, the development team and Gimnazija
            Niko Rolović shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages arising out of or related to your use of the App.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">12. Account Termination</h2>
          <p className="text-gray-400 leading-relaxed">
            We may suspend or terminate your account at any time if you violate these Terms of Use.
            You may delete your account at any time through Profile → Settings → Delete Account.
            Upon termination, your right to use the App ceases immediately.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">13. Changes to Terms</h2>
          <p className="text-gray-400 leading-relaxed">
            We reserve the right to update these Terms of Use at any time. Continued use of the App
            after changes are posted constitutes acceptance of the revised terms. Material changes
            will be communicated through in-app notifications.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">14. Governing Law</h2>
          <p className="text-gray-400 leading-relaxed">
            These Terms of Use are governed by the laws of Montenegro. Any disputes arising from
            these terms shall be resolved in the courts of Bar, Montenegro.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">15. Contact</h2>
          <p className="text-gray-400 leading-relaxed">
            For questions about these Terms of Use, please contact us at{' '}
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
            <a href="/content-policy" className="text-blue-400 hover:text-blue-300 underline">Content Moderation Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
