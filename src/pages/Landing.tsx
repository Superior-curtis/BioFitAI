import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Activity, Brain, TrendingUp, Target, Sparkles, Dna } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const features = [
    {
      icon: Brain,
      titleKey: 'landing.aiAnalysis',
      descKey: 'landing.aiAnalysisDesc',
    },
    {
      icon: TrendingUp,
      titleKey: 'landing.dataVisualization',
      descKey: 'landing.dataVisualizationDesc',
    },
    {
      icon: Target,
      titleKey: 'landing.goalManagement',
      descKey: 'landing.goalManagementDesc',
    },
    {
      icon: Dna,
      titleKey: 'landing.biologyKnowledge',
      descKey: 'landing.biologyKnowledgeDesc',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header with Language Switcher */}
      <div className="container mx-auto px-4 py-4 flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}}></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl animate-float">
                <Activity className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              {t('landing.title')}
            </h1>
            
            <p className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
              {t('landing.subtitle')}
            </p>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('landing.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/dashboard")}
                className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('landing.startButton')}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth")}
                className="text-lg px-8 py-6"
              >
                {t('landing.loginButton')}
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 bg-card/80 backdrop-blur"
                >
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{t(feature.titleKey)}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {t(feature.descKey)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Academic Focus */}
          <div className="mt-20 text-center">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <CardContent className="py-12">
                <h2 className="text-3xl font-bold mb-6">{t('landing.scienceBased')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">🧬</div>
                    <h3 className="font-semibold mb-2">{t('landing.biochemistry')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('landing.biochemistryDesc')}
                    </p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">⚗️</div>
                    <h3 className="font-semibold mb-2">{t('landing.nutrition')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('landing.nutritionDesc')}
                    </p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">💪</div>
                    <h3 className="font-semibold mb-2">{t('landing.sportPhysiology')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('landing.sportPhysiologyDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>{t('landing.copyright')}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
