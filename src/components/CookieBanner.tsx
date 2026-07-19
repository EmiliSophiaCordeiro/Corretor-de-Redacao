import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const KEY = "carraco.cookies.consent";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setVisible(true); } catch {}
  }, []);
  if (!visible) return null;
  const accept = () => { try { localStorage.setItem(KEY, "accepted"); } catch {} setVisible(false); };
  return (
    <div className="fixed bottom-4 inset-x-4 md:inset-x-auto md:right-4 md:max-w-md z-50 rounded-2xl glass border border-border p-4 shadow-card">
      <p className="text-sm text-foreground mb-3">
        Usamos apenas cookies essenciais para autenticação e preferências. Ao continuar, você concorda com nossa{" "}
        <Link to="/cookies" className="text-primary underline">Política de Cookies</Link> e{" "}
        <Link to="/privacy" className="text-primary underline">Privacidade</Link>.
      </p>
      <div className="flex justify-end">
        <Button size="sm" onClick={accept} className="gradient-primary text-primary-foreground border-0">Entendi</Button>
      </div>
    </div>
  );
};
export default CookieBanner;
