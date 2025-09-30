import Container from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Spirit of Santa",
  description: "Terms of Service for Spirit of Santa - Christmas list management platform. Learn about user rights, responsibilities, and service policies.",
  keywords: "terms of service, user agreement, Christmas list, Spirit of Santa, family platform",
  robots: "index, follow",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8">
      <Container className="max-w-4xl">
        <Card className="p-8 md:p-12">
          <h1 className="text-4xl font-paytone-one text-santa mb-8 text-center">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last Updated:</strong> September 30, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to Spirit of Santa! These Terms of Service (&ldquo;Terms&rdquo;) govern your use of our website and services. By accessing or using Spirit of Santa, you agree to be bound by these Terms. If you do not agree, please do not use our Service.
              </p>
              <p className="mb-4">
                Spirit of Santa is a family-friendly platform designed to help parents manage their children&rsquo;s Christmas lists, track behavior through our &ldquo;Naughty/Nice Meter,&rdquo; and earn &ldquo;Christmas Magic&rdquo; points for good deeds and achievements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">2. Eligibility and Account Requirements</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Age Requirements</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must be a parent or legal guardian to add children to your account</li>
                <li>Children under 13 may only use the Service under direct parental supervision</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Responsibilities</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide accurate and current information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">3. Service Description</h2>
              <p className="mb-4">Spirit of Santa provides:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Christmas List Management:</strong> Create and manage wish lists for children</li>
                <li><strong>Naughty/Nice Meter:</strong> Track behavior and good deeds</li>
                <li><strong>Christmas Magic Points:</strong> Reward system for positive behavior</li>
                <li><strong>Gift Fulfillment:</strong> Optional purchasing and delivery services</li>
                <li><strong>Community Features:</strong> Share lists and donate to other families</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">4. User Conduct and Prohibited Uses</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Acceptable Use</h3>
              <p className="mb-4">You agree to use our Service only for lawful purposes and in accordance with these Terms.</p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Prohibited Activities</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Violating any applicable laws or regulations</li>
                <li>Impersonating others or providing false information</li>
                <li>Harassing, threatening, or intimidating other users</li>
                <li>Uploading harmful content or malware</li>
                <li>Attempting to gain unauthorized access to our systems</li>
                <li>Using the Service for commercial purposes without permission</li>
                <li>Scraping or automated data collection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">5. Payment Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Christmas Magic Points</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Christmas Magic points can be purchased or earned through good deeds</li>
                <li>Points have no real-world monetary value</li>
                <li>Points cannot be transferred between accounts</li>
                <li>Unused points may expire according to our policy</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Payments and Refunds</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>All payments are processed securely through Stripe</li>
                <li>Prices are subject to change with notice</li>
                <li>Refunds are available within 30 days for unused services</li>
                <li>Gift purchases may have different refund policies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">6. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Our Rights</h3>
              <p className="mb-4">
                Spirit of Santa and all related content, features, and functionality are owned by us and protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Content</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>You retain ownership of content you submit</li>
                <li>You grant us a license to use your content to provide our Service</li>
                <li>You are responsible for ensuring you have rights to submit content</li>
                <li>We may remove content that violates these Terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">7. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information. By using our Service, you consent to our privacy practices as described in our Privacy Policy.
              </p>
              <p className="mb-4">
                We comply with applicable privacy laws, including COPPA for children&rsquo;s data protection.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">8. Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Availability</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                <li>Scheduled maintenance may temporarily affect availability</li>
                <li>We are not responsible for third-party service interruptions</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Warranty Disclaimer</h3>
              <p className="mb-4">
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">9. Limitation of Liability</h2>
              <p className="mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPIRIT OF SANTA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE.
              </p>
              <p className="mb-4">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">10. Termination</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">By You</h3>
              <p className="mb-4">You may terminate your account at any time by contacting us or using account settings.</p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">By Us</h3>
              <p className="mb-4">We may terminate or suspend your account for:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Violation of these Terms</li>
                <li>Suspicious or fraudulent activity</li>
                <li>Extended inactivity</li>
                <li>Legal requirements</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">11. Changes to Terms</h2>
              <p className="mb-4">
                We may update these Terms periodically. We will notify you of significant changes by email or through our Service. Your continued use after changes indicates acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">12. Governing Law</h2>
              <p className="mb-4">
                These Terms are governed by the laws of [Your State/Country]. Any disputes will be resolved in the courts of [Your Jurisdiction].
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-evergreen mb-4">13. Contact Information</h2>
              <p className="mb-4">
                For questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>Email:</strong> legal@spiritofsanta.club</p>
                <p><strong>Website:</strong> https://www.spiritofsanta.club</p>
                <p><strong>Mailing Address:</strong></p>
                <p>Spirit of Santa<br />
                [Your Business Address]<br />
                [City, State ZIP Code]</p>
              </div>
            </section>

            <div className="bg-evergreen text-white p-6 rounded-lg mt-8">
              <h3 className="text-xl font-bold mb-2">🎄 Christmas Spirit Agreement</h3>
              <p>
                By using Spirit of Santa, you agree to spread joy, kindness, and Christmas magic. Together, we make the holiday season special for families everywhere!
              </p>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}