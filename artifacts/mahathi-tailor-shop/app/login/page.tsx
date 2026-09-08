import type { Metadata } from 'next';
import Footer from '../components/footer';
import Header from '../components/header';
import AuthForm from '../components/auth-form';

export const metadata: Metadata = {
  title: 'Log in | Mahathi Tailor Shop',
  description: 'Log in to your Mahathi Tailor Shop account.',
};

export default function LoginPage() {
  return (
    <main className="market-shell min-h-[100dvh]">
      <Header />
      <section className="market-container flex min-h-[600px] items-center justify-center py-12">
        <div className="grid w-full max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-[0_14px_40px_rgba(23,23,23,.06)] md:grid-cols-[.9fr_1.1fr]">
          <div className="gradient-ink flex min-h-[250px] flex-col justify-between p-7 text-white sm:p-9">
            <div>
              <p className="font-label text-[9px] uppercase tracking-[.18em] text-white/70">
                Welcome back
              </p>
              <h1 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-[-.06em]">
                Your wardrobe,
                <br />
                your way.
              </h1>
            </div>
            <p className="max-w-[250px] text-[12px] leading-5 text-white/75">
              Keep your favourites, fit details, and Mahathi moments together.
            </p>
          </div>
          <div className="p-7 sm:p-9">
            <p className="font-label text-[9px] uppercase tracking-[.16em] text-[#d600c7]">
              Customer login
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-.05em]">
              Log in to Mahathi
            </h2>
            <p className="mt-2 mb-6 text-[12px] leading-5 text-[#77736f]">
              Use the email and password connected to your account.
            </p>
            <AuthForm mode="login" />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}