import Container from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Spirit of Santa",
  description: "Our comprehensive privacy policy explains how Spirit of Santa protects your family's information and complies with COPPA for children's privacy.",
  keywords: "privacy policy, COPPA compliance, children privacy, data protection, Spirit of Santa",
  robots: "index, follow",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8">
      <Container className="max-w-4xl">
        <Card className="p-8 md:p-12">
          <h1 className="text-4xl font-paytone-one text-santa mb-8 text-center">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last Updated:</strong> September 30, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to Spirit of Santa (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting your privacy and the privacy of your children. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (collectively, the &ldquo;Service&rdquo;).
              </p>
              <p className="mb-4">
                Spirit of Santa is a Christmas-themed platform that helps families manage childrens Christmas lists, track &ldquo;naughty/nice&rdquo; behavior, and earn &ldquo;Christmas Magic&rdquo; points for good deeds and academic achievements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Account information (email address, name)</li>
                <li>Childrens information (names, ages, gift preferences)</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Usage Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Pages visited and time spent on our Service</li>
                <li>Interaction with features and content</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Cookies and Tracking</h3>
              <p className="mb-4">
                We use cookies and similar technologies to enhance your experience, remember your preferences, and analyze usage patterns. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide and maintain our Service</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important updates and notifications</li>
                <li>Personalize your experience</li>
                <li>Improve our Service through analytics</li>
                <li>Ensure security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">4. Childrens Privacy (COPPA Compliance)</h2>
              <p className="mb-4">
                We take childrens privacy seriously and comply with the Childrens Online Privacy Protection Act (COPPA):
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>We do not collect personal information from children under 13 without verifiable parental consent</li>
                <li>Parents have full control over their childrens information</li>
                <li>Children cannot make purchases or share personal information publicly</li>
                <li>Parents can review, modify, or delete their childrens information at any time</li>
                <li>We do not use childrens information for behavioral advertising</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">5. Information Sharing</h2>
              <p className="mb-4">We do not sell your personal information. We may share information in these limited circumstances:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Service Providers:</strong> Trusted third parties who help us operate our Service (e.g., Stripe for payments, Vercel for hosting)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions (with continued privacy protection)</li>
                <li><strong>Consent:</strong> When you explicitly authorize sharing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">6. Data Security</h2>
              <p className="mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication systems</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information</li>
                <li>Secure payment processing through Stripe</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">7. Your Rights and Choices</h2>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Access:</strong> View your personal information</li>
                <li><strong>Correction:</strong> Update inaccurate information</li>
                <li><strong>Deletion:</strong> Request removal of your information</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Parental Rights:</strong> Full control over childrens information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">8. International Users</h2>
              <p className="mb-4">
                Our Service is hosted in the United States. If you access our Service from outside the US, your information may be transferred to, stored, and processed in the US. By using our Service, you consent to this transfer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">9. Updates to This Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy periodically. We will notify you of significant changes by email or through our Service. Your continued use of the Service after changes indicates acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">10. Contact Us</h2>
              <p className="mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> privacy@spiritofsanta.club</p>
                <p><strong>Website:</strong> https://www.spiritofsanta.club</p>
                <p><strong>Mailing Address:</strong></p>
                <p>Spirit of Santa<br />
                [Your Business Address]<br />
                [City, State ZIP Code]</p>
              </div>
            </section>

            <div className="bg-santa text-white p-6 rounded-lg mt-8">
              <h3 className="text-xl font-bold mb-2">🎄 Privacy Commitment</h3>
              <p>
                At Spirit of Santa, we believe in making Christmas magical while keeping your familys information safe and secure. Your trust is the greatest gift you can give us.
              </p>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}