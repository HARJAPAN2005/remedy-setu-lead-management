import './globals.css';

export const metadata = {
  title: 'Remedy Setu | Partner Enquiry',
  description:
    'Remedy Setu — Premium supplier of certified Gemstones, Rudraksha, and Puja Services. Register as a partner: Astrologers, Retailers, and Distributors welcome.',
  keywords: 'gemstones, rudraksha, puja services, wholesale, astrologer partner, retailer, distributor',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
