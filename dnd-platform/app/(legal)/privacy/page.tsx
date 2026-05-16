export const metadata = {
  title: 'Privacy Policy — RealmForge',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-amber-highlight mb-2">Privacy Policy</h1>
          <p className="text-xs text-foreground/50">Last updated: 2026-05-15</p>
        </div>

        <Section title="Who we are">
          RealmForge is an AI-powered Dungeons &amp; Dragons platform. We take your privacy
          seriously and collect only what is needed to run the service.
        </Section>

        <Section title="What we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li>Your email address and password hash when you create an account.</li>
            <li>Your date of birth, used solely for content-rating purposes.</li>
            <li>Campaign data you create: campaign names, character sheets, session messages, and world notes.</li>
            <li>Basic usage metadata: timestamps of API calls and session activity, used for rate-limiting and abuse prevention.</li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> sell your data to third parties. We do not run targeted advertising.
          </p>
        </Section>

        <Section title="How we use it">
          <ul className="list-disc pl-5 space-y-1">
            <li>To authenticate you and keep your campaigns private.</li>
            <li>To send your in-game text to the Groq API (and optionally the Anthropic API) to generate DM responses. These providers have their own privacy policies.</li>
            <li>To detect and prevent abuse of the AI generation endpoints.</li>
          </ul>
        </Section>

        <Section title="Third-party services">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — database and authentication.</li>
            <li><strong>Vercel</strong> — hosting and serverless functions.</li>
            <li><strong>Groq / Anthropic</strong> — AI inference. Your in-game text is sent to these services to generate responses.</li>
            <li><strong>Sentry</strong> — error monitoring. Error payloads may include truncated request context but never full message history.</li>
          </ul>
        </Section>

        <Section title="Data retention">
          Your account and all associated campaign data are retained until you request deletion.
          To delete your account and data, email us at{' '}
          <a href="mailto:shubham.mohta.2995@gmail.com" className="text-amber-highlight underline">
            shubham.mohta.2995@gmail.com
          </a>.
        </Section>

        <Section title="Your rights (GDPR / CCPA)">
          You have the right to access, correct, or delete any personal data we hold about you.
          Contact us at the email above and we will respond within 30 days.
        </Section>

        <Section title="Cookies">
          We use a single session cookie set by Supabase to keep you logged in. No tracking or
          advertising cookies are used.
        </Section>

        <Section title="Contact">
          Questions? Email{' '}
          <a href="mailto:shubham.mohta.2995@gmail.com" className="text-amber-highlight underline">
            shubham.mohta.2995@gmail.com
          </a>.
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-foreground/70 leading-relaxed">{children}</div>
    </section>
  )
}
