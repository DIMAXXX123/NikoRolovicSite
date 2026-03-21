export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: March 2026</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
          <p className="text-gray-400 leading-relaxed">
            The &quot;Gimnazija Niko Rolovi&cacute;&quot; app is a student portal for students of
            Gimnazija Niko Rolovi&cacute; in Bar, Montenegro. The app is developed and maintained
            by a student team of the school.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. Data We Collect</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li>Email address</li>
            <li>Full name</li>
            <li>Class and section number</li>
            <li>Photos (voluntarily uploaded by users)</li>
            <li>Game scores (NikoBlast)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Data</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li>Authentication and portal access</li>
            <li>Displaying schedules, grades, and lessons</li>
            <li>Photo gallery moderation</li>
            <li>Improving user experience</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage</h2>
          <p className="text-gray-400 leading-relaxed">
            Your data is stored on Supabase servers located in the EU (AWS EU region). Data is
            retained while you use the application. You may request deletion of your data at any
            time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Data Sharing</h2>
          <p className="text-gray-400 leading-relaxed">
            We do not sell or share your personal data with third parties. Photos you upload may be
            visible to other portal users after moderation by admins.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Photo Moderation</h2>
          <p className="text-gray-400 leading-relaxed">
            All photos uploaded to the gallery are reviewed by school admins before being made
            visible. Inappropriate content will be removed.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-1.5 leading-relaxed">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to data processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">8. Account Deletion</h2>
          <p className="text-gray-400 leading-relaxed">
            You can delete your account and all associated data at any time from
            Profile &rarr; Settings &rarr; Delete Account. Deletion is permanent and irreversible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">9. Security</h2>
          <p className="text-gray-400 leading-relaxed">
            We use encryption (HTTPS/TLS), secure authentication, and content moderation to protect
            your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">10. Children</h2>
          <p className="text-gray-400 leading-relaxed">
            This application is intended for high school students (ages 15&ndash;19). We do not
            knowingly collect data from children under 13.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">11. Contact</h2>
          <p className="text-gray-400 leading-relaxed">
            For any privacy-related questions, please contact us at{' '}
            <a
              href="mailto:ivaschdima@gmail.com"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              ivaschdima@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
