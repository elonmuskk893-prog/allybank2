"use client";

import { PublicLayout } from "@/components/landing/public-layout";
import { useSite, type SiteInfo } from "@/lib/use-site";

interface ContactInfo {
  email: string | null;
  phone: string | null;
  address: string | null;
  hours: string | null;
}

type SiteWithContact = SiteInfo & {
  contact?: ContactInfo | null;
  support_emails?: string[] | null;
};

const lastUpdated = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function TermsPage() {
  const { site } = useSite();
  const siteData = site as SiteWithContact | null;
  const bankName = siteData?.name ?? "Account Dashboard";
  const contact = siteData?.contact ?? {
    email: null,
    phone: null,
    address: null,
    hours: null,
  };
  const email = (contact.email || siteData?.support_emails?.[0] || "").trim();
  const hasContact = !!(email || contact.phone || contact.address);

  return (
    <PublicLayout>
      <>
        <section className="relative py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-gray-900 dark:from-gray-900 dark:via-blue-900 dark:to-black overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                  animation: "float 20s ease-in-out infinite",
                }}
              />
            </div>
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <i className="fa-solid fa-file-contract mr-2" />
                Legal Information
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                Terms of Service
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Please read these terms carefully before using our online account services
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-12">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By accessing and using this online account platform, you accept and agree to be
                  bound by the terms and provisions of this agreement.
                </p>
                <h2>2. Account Opening and Maintenance</h2>
                <p>To open an account, you must:</p>
                <ul>
                  <li>Be at least 18 years of age</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
                <h2>3. Account Security</h2>
                <p>
                  You are responsible for maintaining the confidentiality of your account
                  information and password. You agree to notify us immediately of any unauthorized
                  use of your account.
                </p>
                <h2>4. Services and Fees</h2>
                <p>
                  This online account platform provides online account services including but not
                  limited to:
                </p>
                <ul>
                  <li>Online account access</li>
                  <li>Transfers and payments</li>
                  <li>Cards and account statements</li>
                </ul>
                <h2>5. Privacy and Data Protection</h2>
                <p>
                  We are committed to protecting your privacy and personal information. Please
                  review our Privacy Policy for detailed information about how we collect, use, and
                  protect your data.
                </p>
                <h2>6. Electronic Communications</h2>
                <p>
                  By using our services, you consent to receive communications from us
                  electronically, including account statements, notices, and other disclosures.
                </p>
                <h2>7. Limitation of Liability</h2>
                <p>
                  {bankName} shall not be liable for any indirect, incidental, special,
                  consequential, or punitive damages arising from your use of our services.
                </p>
                <h2>8. Modifications to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify you of any
                  changes by posting the new terms on our website.
                </p>
                <h2>9. Governing Law</h2>
                <p>
                  These terms shall be governed by and construed in accordance with the laws of the
                  jurisdiction in which {bankName}
                  operates.
                </p>
                <h2>10. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us
                  {hasContact ? " at:" : " through the contact page on this site."}
                </p>
                {hasContact && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mt-4">
                    {email && (
                      <p className="mb-2 break-all">
                        <strong>Email:</strong> {email}
                      </p>
                    )}
                    {contact.phone && (
                      <p className="mb-2 whitespace-pre-line">
                        <strong>Phone:</strong> {contact.phone}
                      </p>
                    )}
                    {contact.address && (
                      <p className="whitespace-pre-line">
                        <strong>Address:</strong> {contact.address}
                      </p>
                    )}
                  </div>
                )}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last updated: {lastUpdated}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    </PublicLayout>
  );
}
