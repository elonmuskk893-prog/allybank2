"use client";

import { useState } from "react";
import { PublicLayout } from "@/components/landing/public-layout";
import { bankFetch } from "@/lib/api";
import { useSite, type SiteInfo } from "@/lib/use-site";
import { toast } from "sonner";

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

export default function ContactPage() {
  const { site } = useSite();
  const siteData = site as SiteWithContact | null;
  const contact = siteData?.contact ?? {
    email: null,
    phone: null,
    address: null,
    hours: null,
  };
  const email = (
    contact.email ||
    siteData?.support_emails?.[0] ||
    ""
  ).trim();
  const hasContact = !!(contact.phone || email || contact.address || contact.hours);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-gray-900 py-16 dark:from-gray-900 dark:via-blue-900 dark:to-black lg:py-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute left-0 top-0 h-full w-full"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, #ffffff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)",
                backgroundSize: "60px 60px",
                animation: "float 20s ease-in-out infinite",
              }}
            />
          </div>
          <div className="absolute left-20 top-20 h-96 w-96 animate-pulse rounded-full bg-blue-500/20 blur-3xl" />
          <div
            className="absolute bottom-20 right-20 h-80 w-80 animate-pulse rounded-full bg-teal-500/20 blur-3xl"
            style={{ animationDelay: "1s" }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
              <i className="fa-solid fa-phone-volume mr-2 animate-pulse" />
              Get In Touch
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Contact Us
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-gray-300">
              We&apos;re here to help with all your banking needs. Reach out to
              us anytime.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 grid-cols-1 lg:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-8 dark:bg-gray-800">
              <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                Send us a Message
              </h2>
              <ContactForm />
            </div>
            <div className="space-y-8">
              <div>
                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                  Get in Touch
                </h2>
                <p className="mb-8 text-gray-600 dark:text-gray-300">
                  Have questions about our services? Need help with your
                  account? Our team is ready to assist you.
                </p>
              </div>
              {hasContact && (
                <div className="space-y-6">
                  {contact.phone && (
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <i className="fa-solid fa-phone text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                          Phone
                        </h3>
                        <p className="whitespace-pre-line text-gray-600 dark:text-gray-300">
                          {contact.phone}
                        </p>
                      </div>
                    </div>
                  )}
                  {email && (
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
                        <i className="fa-solid fa-envelope text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                          Email
                        </h3>
                        <p className="break-all text-gray-600 dark:text-gray-300">
                          {email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Response within 24 hours
                        </p>
                      </div>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                        <i className="fa-solid fa-map-marker-alt text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                          Visit Us
                        </h3>
                        <p className="whitespace-pre-line text-gray-600 dark:text-gray-300">
                          {contact.address}
                        </p>
                      </div>
                    </div>
                  )}
                  {contact.hours && (
                    <div className="flex items-start space-x-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                        <i className="fa-solid fa-clock text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                          Banking Hours
                        </h3>
                        <p className="whitespace-pre-line text-gray-600 dark:text-gray-300">
                          {contact.hours}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {contact.address && (
        <section className="bg-gray-50 py-16 dark:bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                Find Our Locations
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Visit any of our convenient branch locations
              </p>
            </div>
            <div className="flex h-96 items-center justify-center rounded-2xl bg-gray-300 dark:bg-gray-700">
              <div className="px-6 text-center">
                <i className="fa-solid fa-map-marker-alt mb-4 text-4xl text-gray-500 dark:text-gray-400" />
                <p className="whitespace-pre-line text-gray-700 dark:text-gray-200">
                  {contact.address}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: string; text: string } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    setSending(true);
    const res = await bankFetch("/contact", {
      method: "POST",
      body: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      },
    });
    setSending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Couldn't send -- please try again.");
      return;
    }
    setStatus({
      kind: "ok",
      text: "Thanks! We've got your message and will reply soon.",
    });
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

  const p =
    "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:opacity-60";
  const f =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <div>
          <label htmlFor="name" className={f}>
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={sending}
            className={p}
          />
        </div>
        <div>
          <label htmlFor="email" className={f}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={sending}
            className={p}
          />
        </div>
      </div>
      <div>
        <label htmlFor="subject" className={f}>
          Subject
        </label>
        <input
          id="subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={sending}
          className={p}
        />
      </div>
      <div>
        <label htmlFor="message" className={f}>
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={sending}
          className={p}
        />
      </div>
      {status && (
        <p
          className={`text-sm ${"ok" === status.kind ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
        >
          {status.text}
        </p>
      )}
      <button
        type="submit"
        disabled={
          sending || !name.trim() || !email.trim() || message.trim().length < 5
        }
        className="w-full rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl disabled:translate-y-0 disabled:opacity-50"
      >
        {sending ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white align-[-2px]" />
        ) : (
          <i className="fa-solid fa-paper-plane mr-2" />
        )}
        Send Message
      </button>
    </form>
  );
}