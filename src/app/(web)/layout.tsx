import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <iframe
        src="https://empowersyouthchatbot.vercel.app/"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg border-0"
        style={{ zIndex: 1000 }}
        title="Empowers Chatbot"
        allow="microphone"
      ></iframe>
    </div>
  );
}
