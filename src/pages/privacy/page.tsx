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

export default function PrivacyPage() {
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
            <div className="absolute top-20 left-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-full text-sm font-semibold mb-6 border border-white/20">
                <i className="fa-solid fa-shield-halved mr-2" />
                Privacy &amp; Security
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
                Privacy Policy
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Your privacy is our priority. Learn how we protect and handle your personal
                information
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 lg:p-12">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <h2>1. Information We Collect</h2>
                <p>
                  {bankName} collects information to provide better services to our customers. We
                  collect information in the following ways:
                </p>
                <ul>
                  <li>
                    <strong>Personal Information:</strong> Name, address, phone number, email
                    address, Social Security number, and other identifying information
                  </li>
                  <li>
                    <strong>Financial Information:</strong> Account balances, payment history,
                    credit information, and transaction details
                  </li>
                  <li>
                    <strong>Technical Information:</strong> IP address, browser type, device
                    information, and usage data
                  </li>
                  <li>
                    <strong>Communication Records:</strong> Records of your communications with us,
                    including phone calls and emails
                  </li>
                </ul>
                <h2>2. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Provide and maintain our online account services</li>
                  <li>Process transactions and manage your accounts</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Prevent fraud and enhance security</li>
                  <li>Improve our services and customer experience</li>
                  <li>Communicate with you about your accounts and services</li>
                </ul>
                <h2>3. Information Sharing</h2>
                <p>
                  We do not sell, rent, or trade your personal information. We may share your
                  information only in the following circumstances:
                </p>
                <ul>
                  <li>With your consent or at your direction</li>
                  <li>With service providers who assist us in our operations</li>
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>In connection with a merger, acquisition, or sale of assets</li>
                </ul>
                <h2>4. Data Security</h2>
                <p>We implement robust security measures to protect your information:</p>
                <ul>
                  <li>
                    <strong>Encryption:</strong> All sensitive data is encrypted in transit and at
                    rest
                  </li>
                  <li>
                    <strong>Access Controls:</strong> Strict access controls limit who can view your
                    information
                  </li>
                  <li>
                    <strong>Monitoring:</strong> Continuous monitoring for suspicious activities
                  </li>
                  <li>
                    <strong>Regular Audits:</strong> Regular security audits and assessments
                  </li>
                </ul>
                <h2>5. Your Rights and Choices</h2>
                <p>You have the following rights regarding your personal information:</p>
                <ul>
                  <li>Access and review your personal information</li>
                  <li>Request corrections to inaccurate information</li>
                  <li>Opt out of certain communications</li>
                  <li>Request deletion of your information (subject to legal requirements)</li>
                  <li>File a complaint with regulatory authorities</li>
                </ul>
                <h2>6. Cookies and Tracking Technologies</h2>
                <p>
                  We use cookies and similar technologies to enhance your experience on our website.
                  These technologies help us:
                </p>
                <ul>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze website traffic and usage patterns</li>
                  <li>Provide personalized content and advertisements</li>
                  <li>Improve website functionality and performance</li>
                </ul>
                <h2>7. Third-Party Services</h2>
                <p>
                  Our website may contain links to third-party websites or services. We are not
                  responsible for the privacy practices of these third parties. We encourage you to
                  review their privacy policies.
                </p>
                <p>
                  Signed-in members may use our live-chat widget, which is provided by Smartsupp.
                  Messages sent through the widget are processed by Smartsupp under its privacy
                  policy. The widget is only loaded after you sign in.
                </p>
                <h2>8. Children&apos;s Privacy</h2>
                <p>
                  Our services are not intended for children under 13 years of age. We do not
                  knowingly collect personal information from children under 13.
                </p>
                <h2>9. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any
                  material changes by posting the new policy on our website and updating the
                  &quot;Last Updated&quot; date.
                </p>
                <h2>10. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy or our privacy practices,
                  please contact us
                  {hasContact ? ":" : " through the contact page on this site."}
                </p>
                {hasContact && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mt-4">
                    <p className="mb-2">
                      <strong>Privacy Officer</strong>
                    </p>
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
