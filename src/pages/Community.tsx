import Mascot from "@/components/Mascot";
import { MessageCircle } from "lucide-react";

const Community = () => {
  return (
    <div className="container max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="inline-block animate-float mb-6">
        <Mascot size={140} mood="wink" hat="cap" />
      </div>
      <h1 className="text-3xl font-display font-bold mb-2">Comunidade em breve</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Em breve você poderá conversar com outros estudantes, compartilhar redações e formar grupos de estudo.
      </p>
      <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5" /> Chat em tempo real • Grupos • Reações
      </div>
    </div>
  );
};

export default Community;
