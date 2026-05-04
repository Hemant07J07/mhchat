"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Lock, Eye, Trash2 } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Privacy & Terms</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 prose prose-sm max-w-none">
        {/* Privacy Policy */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={32} className="text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-900">Privacy Policy</h2>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Data Collection</h3>
              <p className="text-gray-700 leading-relaxed">
                MHChat collects the following information:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2">
                <li>Account information (email, username, name)</li>
                <li>Conversation content and chat history</li>
                <li>Usage analytics (time, frequency, feature usage)</li>
                <li>Technical information (browser type, IP address)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Data Use</h3>
              <p className="text-gray-700 leading-relaxed">
                We use your data to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2">
                <li>Provide and improve MHChat services</li>
                <li>Train and improve our AI models (with your consent)</li>
                <li>Send important account notifications</li>
                <li>Detect and prevent abuse or security threats</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Data Protection</h3>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2">
                <li>End-to-end encryption for conversations</li>
                <li>Secure HTTPS/TLS connections</li>
                <li>Regular security audits and penetration testing</li>
                <li>Restricted access to personal data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Third-Party Sharing</h3>
              <p className="text-gray-700 leading-relaxed">
                We do <strong>not</strong> sell or share your data with third parties for marketing purposes. 
                We may share data with service providers under confidentiality agreements, and when required by law.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h3>
              <p className="text-gray-700 leading-relaxed">
                You have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2">
                <li><strong>Access:</strong> Request a copy of your data</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and conversations</li>
                <li><strong>Portability:</strong> Export your data in a standard format</li>
                <li><strong>Opt-out:</strong> Disable data processing for model improvement</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Retention</h3>
              <p className="text-gray-700 leading-relaxed">
                We retain your data for as long as your account is active. After account deletion, 
                we retain anonymized data for service improvement and may retain it if required by law.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Updates to This Policy</h3>
              <p className="text-gray-700 leading-relaxed">
                We may update this privacy policy periodically. We will notify you of significant changes via email.
              </p>
            </div>
          </div>
        </section>

        {/* Terms of Service */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={32} className="text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-900">Terms of Service</h2>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Important Disclaimers</h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>MHChat is not a medical professional or mental health provider.</strong> 
                The AI responses provided are not clinical diagnoses or treatment plans. 
                If you need professional mental health services, please contact a licensed mental health professional.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>In case of emergency:</strong> Call 911 or contact the National Suicide Prevention Lifeline 
                at 988 immediately. Do not rely solely on MHChat during a crisis.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. User Responsibilities</h3>
              <p className="text-gray-700 leading-relaxed">
                Users agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2">
                <li>Not use MHChat for illegal purposes</li>
                <li>Not attempt to bypass security measures</li>
                <li>Not share account credentials with others</li>
                <li>Not use MHChat as a substitute for professional medical advice</li>
                <li>Accept responsibility for maintaining session security</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                MHChat is provided "as is" without warranties. We are not liable for:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2">
                <li>Inaccurate or incomplete AI responses</li>
                <li>Mental health outcomes or decisions based on AI advice</li>
                <li>Service interruptions or data loss</li>
                <li>Unauthorized access due to user negligence</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Account Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                We may terminate accounts that violate these terms or pose a safety risk. 
                Upon termination, account data will be deleted unless required by law.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Content Moderation</h3>
              <p className="text-gray-700 leading-relaxed">
                We monitor conversations for:
              </p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-2">
                <li>Crisis situations requiring emergency response</li>
                <li>Abuse, harassment, or illegal content</li>
                <li>Safety threats to self or others</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                If we detect a crisis, we may contact emergency services.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Changes to These Terms</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to update these terms. Continued use of MHChat after updates 
                constitutes acceptance of the new terms.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <div className="bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 p-8">
            <h3 className="text-xl font-semibold text-indigo-900 mb-3">Questions or Concerns?</h3>
            <p className="text-indigo-800 mb-4">
              If you have questions about our privacy policy or terms of service, please contact us:
            </p>
            <div className="space-y-2">
              <p className="text-indigo-800">📧 Email: <span className="font-mono">privacy@mhchat.app</span></p>
              <p className="text-indigo-800">📱 Support: <span className="font-mono">support@mhchat.app</span></p>
            </div>
          </div>
        </section>

        {/* Back Button */}
        <div className="text-center pb-12">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition">
            <ArrowLeft size={18} />
            Back to Chat
          </Link>
        </div>
      </main>
    </div>
  );
}
