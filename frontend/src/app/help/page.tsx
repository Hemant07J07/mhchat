"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, AlertCircle, HelpCircle, ShieldAlert, MessageCircle } from "lucide-react";
import Link from "next/link";

interface Resource {
  title: string;
  description: string;
  contact: string;
  available: string;
  icon: React.ReactNode;
  type: "crisis" | "support" | "info";
}

interface FAQItem {
  question: string;
  answer: string;
}

const crisisResources: Resource[] = [
  {
    title: "National Suicide Prevention Lifeline",
    description: "24/7 support for suicidal thoughts and emotional distress",
    contact: "988 (call or text)",
    available: "24/7",
    icon: <Phone size={24} className="text-red-500" />,
    type: "crisis",
  },
  {
    title: "Crisis Text Line",
    description: "Text HOME to 741741 for crisis support via text",
    contact: "Text HOME to 741741",
    available: "24/7",
    icon: <MessageCircle size={24} className="text-red-500" />,
    type: "crisis",
  },
  {
    title: "National Alliance on Mental Illness (NAMI)",
    description: "Helpline for mental health support and resources",
    contact: "1-800-950-NAMI (6264)",
    available: "M-F 10am-10pm ET",
    icon: <ShieldAlert size={24} className="text-orange-500" />,
    type: "support",
  },
];

const supportResources: Resource[] = [
  {
    title: "SAMHSA National Helpline",
    description: "Free, confidential treatment referral and information service",
    contact: "1-800-662-4357",
    available: "24/7",
    icon: <Phone size={24} className="text-indigo-500" />,
    type: "support",
  },
  {
    title: "The Trevor Project",
    description: "Crisis support for LGBTQ+ youth",
    contact: "1-866-488-7386",
    available: "24/7",
    icon: <MessageCircle size={24} className="text-indigo-500" />,
    type: "support",
  },
  {
    title: "Veterans Crisis Line",
    description: "Support for military veterans in crisis",
    contact: "988 then press 1",
    available: "24/7",
    icon: <ShieldAlert size={24} className="text-indigo-500" />,
    type: "support",
  },
];

const faqs: FAQItem[] = [
  {
    question: "What is MHChat?",
    answer: "MHChat is an AI-powered mental health support application designed to provide immediate, accessible mental health assistance. Our chatbot uses advanced natural language processing to understand your concerns and provide relevant support resources, coping strategies, and guidance.",
  },
  {
    question: "Is MHChat a replacement for professional mental health care?",
    answer: "No. MHChat is NOT a substitute for professional medical or mental health advice. This application is designed to supplement, not replace, professional mental health services. If you're experiencing a mental health crisis, please contact emergency services or one of the crisis resources listed on this page immediately.",
  },
  {
    question: "Is my conversation private and secure?",
    answer: "Yes. All conversations are encrypted and stored securely. Your data is never shared with third parties without explicit consent. However, if you indicate you are in danger or at risk of harm, we may be required to escalate to appropriate authorities.",
  },
  {
    question: "How does the AI learn about my needs?",
    answer: "The AI uses your messages to understand your current situation and provide personalized responses. Your conversation history helps the chatbot provide more contextual and relevant support over time. You can delete conversations at any time.",
  },
  {
    question: "What should I do in a mental health emergency?",
    answer: "In an emergency, please call 911 or local emergency services. You can also contact the National Suicide Prevention Lifeline at 988 (available 24/7). Do not rely solely on this application during a crisis.",
  },
  {
    question: "Can I download or export my conversations?",
    answer: "Currently, you can view your conversation history within the app. Export functionality is coming soon. You retain the right to request your data at any time.",
  },
  {
    question: "Who built MHChat and how is it regulated?",
    answer: "MHChat was built as a mental health support tool. While AI-powered, our responses are designed to be helpful and supportive. Always prioritize professional medical advice over AI recommendations.",
  },
  {
    question: "How can I give feedback or report issues?",
    answer: "We'd love to hear from you! Please use the feedback form in your settings or email us directly. Your input helps us improve the platform.",
  },
];

export default function HelpPage() {
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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Help & Resources</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Crisis Banner */}
        <div className="mb-12 p-6 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex gap-4">
            <AlertCircle size={28} className="text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-bold text-red-900 mb-2">In Crisis?</h2>
              <p className="text-red-900 mb-3 font-medium">
                If you're experiencing a mental health emergency or having thoughts of self-harm, please reach out for help immediately.
              </p>
              <div className="text-red-900 font-bold text-base">
                📞 Call 988 (Suicide & Crisis Lifeline) or text HOME to 741741
              </div>
            </div>
          </div>
        </div>

        {/* Crisis Resources */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ShieldAlert size={28} className="text-red-600" />
            Immediate Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {crisisResources.map((resource, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex gap-3 mb-3">
                  {resource.icon}
                  <div>
                    <h3 className="font-bold text-gray-800">{resource.title}</h3>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-4">{resource.description}</p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-600 mb-2 font-medium">Contact:</p>
                  <p className="font-semibold text-lg text-gray-900 mb-1">{resource.contact}</p>
                  <p className="text-xs text-gray-700 font-medium">Available: {resource.available}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Support Resources */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Phone size={28} className="text-indigo-600" />
            Support Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {supportResources.map((resource, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex gap-3 mb-3">
                  {resource.icon}
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">{resource.title}</h3>
                  </div>
                </div>
                <p className="text-gray-700 text-sm mb-4">{resource.description}</p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-600 mb-2 font-medium">Contact:</p>
                  <p className="font-semibold text-gray-900 mb-1">{resource.contact}</p>
                  <p className="text-xs text-gray-700 font-medium">Available: {resource.available}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HelpCircle size={28} className="text-indigo-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition group"
              >
                <summary className="flex items-start justify-between cursor-pointer font-semibold text-gray-900 hover:text-indigo-700">
                  <span className="text-lg text-gray-900">{faq.question}</span>
                  <span className="text-2xl text-gray-600 group-open:text-indigo-600 ml-4 flex-shrink-0">+</span>
                </summary>
                <p className="text-gray-700 mt-4 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Important Disclaimer */}
        <div className="mt-16 p-6 bg-indigo-50 border border-indigo-300 rounded-lg">
          <h3 className="font-bold text-indigo-900 mb-3 text-lg">Important Disclaimer</h3>
          <p className="text-indigo-900 text-sm leading-relaxed mb-3 font-medium">
            MHChat is an AI-powered application and is <strong>not a substitute for professional mental health services or emergency care</strong>. 
            The information provided by MHChat should not be used as the sole basis for any health decision, and we urge you to consult qualified healthcare professionals for proper diagnosis and treatment.
          </p>
          <p className="text-indigo-900 text-sm leading-relaxed font-medium">
            In case of a medical emergency or if you believe you are at risk of self-harm, please contact emergency services (911) or the National Suicide Prevention Lifeline (988) immediately.
          </p>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition">
            <ArrowLeft size={18} />
            Back to Chat
          </Link>
        </div>
      </main>
    </div>
  );
}
