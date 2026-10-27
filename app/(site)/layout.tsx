import Header from "./header";
import Footer from "./footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="wrap">{children}</main>
      <Footer />
    </>
  );
}
