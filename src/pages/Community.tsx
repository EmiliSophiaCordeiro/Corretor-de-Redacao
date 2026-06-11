import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MessageCircle, Send, MoreVertical, Flag, Trash2, Edit3, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "geral",        label: "Geral",                color: "bg-slate-500" },
  { id: "redacao",      label: "Redação",              color: "bg-indigo-500" },
  { id: "matematica",   label: "Matemática",           color: "bg-blue-500" },
  { id: "linguagens",   label: "Linguagens",           color: "bg-pink-500" },
  { id: "humanas",      label: "C. Humanas",           color: "bg-amber-500" },
  { id: "natureza",     label: "C. Natureza",          color: "bg-emerald-500" },
  { id: "duvidas",      label: "Dúvidas",              color: "bg-purple-500" },
  { id: "motivacao",    label: "Motivação",            color: "bg-rose-500" },
];

interface Post {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
  liked_by_me?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeCat, setActiveCat] = useState("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [openPost, setOpenPost] = useState<Post | null>(null);

  const loadPosts = async () => {
    if (!user) return;
    const { data: postRows } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!postRows) return setPosts([]);

    const userIds = Array.from(new Set(postRows.map((p: any) => p.user_id)));
    const [{ data: profs }, { data: myLikes }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds),
      supabase.from("community_likes").select("post_id").eq("user_id", user.id),
    ]);
    const profMap = new Map((profs || []).map((p: any) => [p.user_id, p]));
    const likedSet = new Set((myLikes || []).map((l: any) => l.post_id));

    setPosts(postRows.map((p: any) => ({
      ...p,
      profile: profMap.get(p.user_id),
      liked_by_me: likedSet.has(p.id),
    })));
  };

  useEffect(() => { loadPosts(); }, [user?.id]);

  const filtered = useMemo(() =>
    activeCat === "all" ? posts : posts.filter(p => p.category === activeCat),
    [posts, activeCat]
  );

  const toggleLike = async (post: Post) => {
    if (!user) return;
    if (post.liked_by_me) {
      await supabase.from("community_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("community_likes").insert({ post_id: post.id, user_id: user.id });
      // Trigger achievement check for likes received (post owner)
      await supabase.rpc("check_and_unlock_achievements" as any, { _user_id: post.user_id });
    }
    setPosts(ps => ps.map(p => p.id === post.id ? {
      ...p,
      liked_by_me: !post.liked_by_me,
      likes_count: p.likes_count + (post.liked_by_me ? -1 : 1)
    } : p));
  };

  const deletePost = async (post: Post) => {
    if (!confirm("Excluir esta publicação?")) return;
    await supabase.from("community_posts").delete().eq("id", post.id);
    setPosts(ps => ps.filter(p => p.id !== post.id));
    toast.success("Publicação excluída");
  };

  const reportPost = async (post: Post) => {
    const reason = prompt("Por que está denunciando este conteúdo?");
    if (!reason || !user) return;
    await supabase.from("community_reports").insert({
      reporter_id: user.id, target_type: "post", target_id: post.id, reason
    });
    toast.success("Denúncia enviada. Obrigado!");
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Comunidade</h1>
          <p className="text-sm text-muted-foreground">Compartilhe, aprenda e cresça com outros estudantes</p>
        </div>
        <Button onClick={() => setComposerOpen(true)} className="gradient-primary text-primary-foreground border-0 glow">
          <Plus className="h-4 w-4 mr-1" /> Novo post
        </Button>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-1">
        <CatPill active={activeCat==="all"} onClick={() => setActiveCat("all")} label="Todas" />
        {CATEGORIES.map(c => (
          <CatPill key={c.id} active={activeCat===c.id} onClick={() => setActiveCat(c.id)} label={c.label} color={c.color} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground mb-4">Nenhuma publicação ainda.</p>
          <Button onClick={() => setComposerOpen(true)} variant="outline">Seja o primeiro a postar</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(post => (
            <PostCard key={post.id} post={post}
              onOpen={() => setOpenPost(post)}
              onLike={() => toggleLike(post)}
              onDelete={() => deletePost(post)}
              onReport={() => reportPost(post)}
              isOwner={post.user_id === user?.id}
            />
          ))}
        </div>
      )}

      <Composer open={composerOpen} onClose={() => setComposerOpen(false)} onCreated={loadPosts} />
      {openPost && <PostDialog post={openPost} onClose={() => { setOpenPost(null); loadPosts(); }} />}
    </div>
  );
};

const CatPill = ({ active, onClick, label, color }: any) => (
  <button onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
      active ? "gradient-primary text-primary-foreground glow" : "glass hover:bg-muted"
    }`}>
    {color && <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5 align-middle`} />}
    {label}
  </button>
);

const PostCard = ({ post, onOpen, onLike, onDelete, onReport, isOwner }: any) => {
  const cat = CATEGORIES.find(c => c.id === post.category);
  return (
    <article className="rounded-2xl bg-card border border-border p-5 hover:shadow-card transition-shadow animate-fade-in">
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar url={post.profile?.avatar_url} name={post.profile?.display_name} />
          <div>
            <p className="text-sm font-medium">{post.profile?.display_name || "Estudante"}</p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(post.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              {cat && <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${cat.color} text-white`}>{cat.label}</span>}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center">
            <MoreVertical className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner ? (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onReport}>
                <Flag className="h-4 w-4 mr-2" /> Denunciar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="cursor-pointer" onClick={onOpen}>
        <h3 className="font-display font-semibold text-lg mb-1">{post.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{post.content}</p>
      </div>

      <footer className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <button onClick={onLike} className={`flex items-center gap-1.5 transition-colors ${post.liked_by_me ? "text-accent" : "hover:text-foreground"}`}>
          <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} /> {post.likes_count}
        </button>
        <button onClick={onOpen} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" /> {post.comments_count}
        </button>
      </footer>
    </article>
  );
};

const Avatar = ({ url, name }: { url?: string | null; name?: string | null }) => (
  url ? <img src={url} alt="" className="h-9 w-9 rounded-full object-cover" />
       : <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
           {(name || "?").charAt(0).toUpperCase()}
         </div>
);

const Composer = ({ open, onClose, onCreated, editing }: { open: boolean; onClose: () => void; onCreated: () => void; editing?: Post }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(editing?.title || "");
  const [content, setContent] = useState(editing?.content || "");
  const [category, setCategory] = useState(editing?.category || "geral");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !editing) { setTitle(""); setContent(""); setCategory("geral"); }
  }, [open, editing]);

  const submit = async () => {
    if (!user || !title.trim() || !content.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    setSaving(true);
    if (editing) {
      await supabase.from("community_posts").update({ title, content, category }).eq("id", editing.id);
      toast.success("Publicação atualizada");
    } else {
      await supabase.from("community_posts").insert({ user_id: user.id, title, content, category });
      await supabase.rpc("check_and_unlock_achievements" as any, { _user_id: user.id });
      toast.success("Publicação criada!");
    }
    setSaving(false);
    onClose();
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{editing ? "Editar publicação" : "Nova publicação"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground font-mono-score">Categoria</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                    category===c.id ? `${c.color} text-white` : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}>{c.label}</button>
              ))}
            </div>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do post" maxLength={120} />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="O que você quer compartilhar?" rows={6} maxLength={4000} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={submit} disabled={saving} className="gradient-primary text-primary-foreground border-0">
              {saving ? "Enviando..." : editing ? "Salvar" : "Publicar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PostDialog = ({ post, onClose }: { post: Post; onClose: () => void }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("community_comments")
      .select("*").eq("post_id", post.id).order("created_at", { ascending: true });
    if (!data) return;
    const ids = Array.from(new Set(data.map((c: any) => c.user_id)));
    const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", ids);
    const pm = new Map((profs || []).map((p: any) => [p.user_id, p]));
    setComments(data.map((c: any) => ({ ...c, profile: pm.get(c.user_id) })));
  };

  useEffect(() => { load(); }, [post.id]);

  const submitComment = async () => {
    if (!user || !newComment.trim()) return;
    await supabase.from("community_comments").insert({
      post_id: post.id, user_id: user.id, parent_id: replyTo, content: newComment.trim()
    });
    await supabase.rpc("check_and_unlock_achievements" as any, { _user_id: user.id });
    setNewComment(""); setReplyTo(null);
    load();
  };

  const deleteComment = async (id: string) => {
    await supabase.from("community_comments").delete().eq("id", id);
    load();
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const repliesOf = (id: string) => comments.filter(c => c.parent_id === id);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{post.title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3 mb-3">
          <Avatar url={post.profile?.avatar_url} name={post.profile?.display_name} />
          <div>
            <p className="text-sm font-medium">{post.profile?.display_name || "Estudante"}</p>
            <p className="text-[11px] text-muted-foreground">{new Date(post.created_at).toLocaleString("pt-BR")}</p>
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap mb-6">{post.content}</p>

        <div className="border-t border-border pt-4">
          <h3 className="font-display font-semibold text-sm mb-3">Comentários ({comments.length})</h3>
          <div className="space-y-3 mb-4">
            {topLevel.map(c => (
              <div key={c.id}>
                <CommentItem c={c} onReply={() => setReplyTo(c.id)} onDelete={() => deleteComment(c.id)} isOwner={c.user_id === user?.id} />
                <div className="ml-10 mt-2 space-y-2">
                  {repliesOf(c.id).map(r => (
                    <CommentItem key={r.id} c={r} onDelete={() => deleteComment(r.id)} isOwner={r.user_id === user?.id} compact />
                  ))}
                </div>
              </div>
            ))}
            {comments.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Seja o primeiro a comentar</p>}
          </div>

          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              Respondendo... <button onClick={() => setReplyTo(null)}><X className="h-3 w-3" /></button>
            </div>
          )}
          <div className="flex gap-2">
            <Input value={newComment} onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), submitComment())} />
            <Button onClick={submitComment} size="icon" className="gradient-primary text-primary-foreground border-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CommentItem = ({ c, onReply, onDelete, isOwner, compact }: any) => (
  <div className={`flex gap-2 ${compact ? "text-xs" : "text-sm"}`}>
    <Avatar url={c.profile?.avatar_url} name={c.profile?.display_name} />
    <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">{c.profile?.display_name || "Estudante"}</p>
        <div className="flex items-center gap-1">
          {onReply && <button onClick={onReply} className="text-[10px] text-muted-foreground hover:text-foreground">Responder</button>}
          {isOwner && <button onClick={onDelete} className="text-[10px] text-destructive hover:underline">Excluir</button>}
        </div>
      </div>
      <p className="whitespace-pre-wrap mt-0.5">{c.content}</p>
    </div>
  </div>
);

export default Community;
