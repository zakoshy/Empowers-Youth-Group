import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChatbotWidget } from "@/components/chatbot-widget";

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
      <ChatbotWidget />
    </div>
  );
}
