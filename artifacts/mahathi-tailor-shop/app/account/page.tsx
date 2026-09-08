import type { Metadata } from 'next';
import Footer from '../components/footer';
import Header from '../components/header';
import AccountContent from '../components/account-content';

export const metadata: Metadata = {
  title: 'My account | Mahathi Tailor Shop',
  description: 'Manage your Mahathi Tailor Shop account.',
};

export default function AccountPage() {
  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <section className="market-container flex min-h-[600px] items-center justify-center py-12">
        <div className="w-full max-w-[620px]">
          <AccountContent />
        </div>
      </section>
      <Footer />
    </main>
  );
}