// Simple landing fallback — use translations
import { useI18n } from "@/hooks/useI18n";

const Index = () => {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{t('landing.title')}</h1>
        <p className="text-xl text-muted-foreground">{t('landing.description')}</p>
      </div>
    </div>
  );
};

export default Index;
