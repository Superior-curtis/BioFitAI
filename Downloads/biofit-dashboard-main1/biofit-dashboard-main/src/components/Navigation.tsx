import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Activity, User, LogOut, Home, Brain, Utensils, Dumbbell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/hooks/useI18n";

const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "已登出",
        description: "您已成功登出",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "登出失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('landing.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('landing.subtitle')}</p>
            </div>
          </button>

          {user && (
            <nav className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard") }>
                <Home className="w-4 h-4 mr-2" />
                {t('nav.dashboard')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/meals")}>
                <Utensils className="w-4 h-4 mr-2" />
                {t('nav.recordMeal')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/exercise")}>
                <Dumbbell className="w-4 h-4 mr-2" />
                {t('nav.recordExercise')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/analysis")}>
                <Brain className="w-4 h-4 mr-2" />
                {t('nav.aiAnalysis')}
              </Button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate("/profile") }>
                <User className="w-4 h-4 mr-2" />
                {t('nav.profile')}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth") }>
              {t('auth.login')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
