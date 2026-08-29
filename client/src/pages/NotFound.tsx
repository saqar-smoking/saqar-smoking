import { Home } from "lucide-react";
import { Link } from "wouter";
import { AgeGateGuard, CommerceHeader } from "@/components/CommerceShell";
import { useCommerce } from "@/contexts/CommerceContext";

export default function NotFound() {
  const { t } = useCommerce();
  return (
    <AgeGateGuard>
      <div className="commerce-shell">
        <CommerceHeader />
        <main className="commerce-main">
          <div className="commerce-empty-page">
            <span className="commerce-eyebrow">404</span>
            <h1>{t.pageNotFound}</h1>
            <Link className="commerce-button commerce-button--dark" href="/">
              <Home size={16} /> {t.backHome}
            </Link>
          </div>
        </main>
      </div>
    </AgeGateGuard>
  );
}
