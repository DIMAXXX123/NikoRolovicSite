export const metadata = {
  title: 'Privacy Policy — Gimnazija Niko Rolović',
  description: 'Privacy Policy for the Gimnazija Niko Rolović student portal and mobile application.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
          <p className="text-gray-400 leading-relaxed">
            The &quot;Gimnazija Niko Rolović&quot; app (&quot;the App&quot;) is a student portal for
            students of Gimnazija Niko Rolović in Bar, Montenegro. The App is developed and
            maintained by the student development team. Contact:{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ivaschdima@gmail.com
            </a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. Data We Collect</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            We collect the following personal data:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li><strong className="text-gray-300">Account information:</strong> Email address, full name, class and section number.</li>
            <li><strong className="text-gray-300">Authentication data:</strong> Login method (email OTP or Google OAuth), session tokens.</li>
            <li><strong className="text-gray-300">User-generated content:</strong> Photos voluntarily uploaded to the gallery.</li>
            <li><strong className="text-gray-300">Game data:</strong> NikoBlast game scores and leaderboard entries.</li>
            <li><strong className="text-gray-300">Usage data:</strong> Basic app usage analytics for improving the user experience.</li>
          </ul>
          <p className="text-gray-400 leading-relaxed mt-3">
            We do <strong className="text-gray-300">not</strong> collect: location data, contact
            lists, financial information, or health data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li>Authentication and secure portal access.</li>
            <li>Displaying personalized schedules, grades, and lessons.</li>
            <li>Photo gallery moderation and display.</li>
            <li>NikoBlast leaderboard functionality.</li>
            <li>Improving the App&apos;s features and user experience.</li>
            <li>Sending important school-related notifications.</li>
          </ul>
          <p className="text-gray-400 leading-relaxed mt-3">
            We do <strong className="text-gray-300">not</strong> use your data for advertising,
            profiling, or behavioral tracking.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Legal Basis for Processing</h2>
          <p className="text-gray-400 leading-relaxed">
            We process your data based on: (a) your consent when creating an account, (b) the
            legitimate interest of providing educational services, and (c) compliance with
            applicable laws. For users under 18, we rely on parental/guardian consent provided at
            account registration.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage &amp; Security</h2>
          <p className="text-gray-400 leading-relaxed">
            Your data is stored on Supabase servers located in the EU (AWS EU region). We implement
            the following security measures:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed mt-2">
            <li>Encryption in transit (HTTPS/TLS) and at rest.</li>
            <li>Secure authentication with OTP and OAuth 2.0.</li>
            <li>Row-level security (RLS) policies on database tables.</li>
            <li>Admin-only access to moderation tools.</li>
            <li>Regular security reviews and updates.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Data Sharing</h2>
          <p className="text-gray-400 leading-relaxed">
            We do <strong className="text-gray-300">not</strong> sell, rent, or share your personal
            data with third parties for commercial purposes. Data is shared only with:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed mt-2">
            <li><strong className="text-gray-300">Supabase:</strong> Cloud infrastructure provider (data processing agreement in place).</li>
            <li><strong className="text-gray-300">Google:</strong> If you use Google OAuth for authentication (only basic profile info).</li>
            <li><strong className="text-gray-300">Other users:</strong> Photos you upload may be visible to other portal users after admin approval.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. Data Retention</h2>
          <p className="text-gray-400 leading-relaxed">
            Personal data is retained for the duration of your active account. Upon account deletion
            or graduation, your data is permanently deleted within 30 days. Anonymized usage
            statistics may be retained for analytical purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">8. Photo Moderation</h2>
          <p className="text-gray-400 leading-relaxed">
            All photos uploaded to the gallery are reviewed by school administrators before being
            made visible. Inappropriate content is removed in accordance with our{' '}
            <a href="/content-policy" className="text-blue-400 hover:text-blue-300 underline">
              Content Moderation Policy
            </a>
            . Users can report content and block other users.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">9. Your Rights</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            Under applicable data protection laws (including GDPR), you have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li><strong className="text-gray-300">Access:</strong> Request a copy of your personal data.</li>
            <li><strong className="text-gray-300">Rectification:</strong> Correct inaccurate or incomplete data.</li>
            <li><strong className="text-gray-300">Erasure:</strong> Request deletion of your personal data.</li>
            <li><strong className="text-gray-300">Restriction:</strong> Request restriction of data processing.</li>
            <li><strong className="text-gray-300">Portability:</strong> Receive your data in a structured, machine-readable format.</li>
            <li><strong className="text-gray-300">Objection:</strong> Object to data processing based on legitimate interests.</li>
            <li><strong className="text-gray-300">Withdraw consent:</strong> Withdraw your consent at any time.</li>
          </ul>
          <p className="text-gray-400 leading-relaxed mt-3">
            To exercise any of these rights, contact us at{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ivaschdima@gmail.com
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">10. Account Deletion</h2>
          <p className="text-gray-400 leading-relaxed">
            You can delete your account and all associated data at any time from
            Profile → Settings → Delete Account. Deletion is permanent and irreversible. All
            personal data, uploaded photos, and game scores will be permanently removed.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">11. Children&apos;s Privacy</h2>
          <p className="text-gray-400 leading-relaxed">
            This App is intended for high school students (ages 15–19). We do not knowingly collect
            personal data from children under the age of 13. If we discover that we have
            inadvertently collected data from a child under 13, we will delete it immediately. If
            you believe a child under 13 has provided us with personal information, please contact
            us at{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ivaschdima@gmail.com
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">12. Third-Party Services</h2>
          <p className="text-gray-400 leading-relaxed">
            The App uses the following third-party services:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed mt-2">
            <li><strong className="text-gray-300">Supabase:</strong> Authentication, database, and file storage.</li>
            <li><strong className="text-gray-300">Google OAuth:</strong> Optional sign-in method.</li>
            <li><strong className="text-gray-300">Vercel:</strong> Web application hosting.</li>
            <li><strong className="text-gray-300">OpenAI:</strong> AI-powered lecture and quiz generation (no personal data sent).</li>
          </ul>
          <p className="text-gray-400 leading-relaxed mt-3">
            Each third-party service has its own privacy policy governing data handling.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">13. Changes to This Policy</h2>
          <p className="text-gray-400 leading-relaxed">
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated &quot;Last updated&quot; date. Material changes will be communicated
            through in-app notifications. Continued use of the App after changes constitutes
            acceptance of the revised policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">14. Contact</h2>
          <p className="text-gray-400 leading-relaxed">
            For any privacy-related questions or data requests, please contact us at{' '}
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
            <a href="/terms" className="text-blue-400 hover:text-blue-300 underline">Terms of Use</a>
            {' · '}
            <a href="/content-policy" className="text-blue-400 hover:text-blue-300 underline">Content Moderation Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
