import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getWeeklyAnalysis, getAcademicKnowledge } from "@/lib/openai";
import { Calendar, TrendingUp, Loader2, Brain, Dna, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useI18n } from "@/hooks/useI18n";

interface AcademicTip {
  title: string;
  content: string;
}

const Analysis = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [academicTips, setAcademicTips] = useState<AcademicTip[]>([]);
  const [weekData, setWeekData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }
      setupRealtimeListeners();
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [user, authLoading, navigate]);

  const setupRealtimeListeners = async () => {
    if (!user) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      // 先拿一次 profile
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      const profile = profileSnap.exists() ? profileSnap.data() : null;

      // Get data from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Real-time listener for meals (no where/orderBy to avoid index requirement)
      const mealsQuery = query(
        collection(db, "meals"),
        where("userId", "==", user.uid)
      );

      const exercisesQuery = query(
        collection(db, "exercises"),
        where("userId", "==", user.uid)
      );

      let meals: any[] = [];
      let exercises: any[] = [];

      const unsubscribeMeals = onSnapshot(mealsQuery, (snapshot) => {
        // Filter by date range in client to avoid index requirement
        meals = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data() as any
          }))
          .filter(meal => {
            const mealDate = meal.timestamp?.toDate?.();
            return mealDate && mealDate >= sevenDaysAgo;
          });
        console.log("Analysis: meals onSnapshot count:", meals.length);
        triggerAnalysisUpdate(meals, exercises, profile);
      });

      const unsubscribeExercises = onSnapshot(exercisesQuery, (snapshot) => {
        // Filter by date range in client
        exercises = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data() as any
          }))
          .filter(exercise => {
            const exerciseDate = exercise.timestamp?.toDate?.();
            return exerciseDate && exerciseDate >= sevenDaysAgo;
          });
        console.log("Analysis: exercises onSnapshot count:", exercises.length);
        triggerAnalysisUpdate(meals, exercises, profile);
      });

      setLoading(false);

      // Return cleanup function
      return () => {
        unsubscribeMeals();
        unsubscribeExercises();
      };
    } catch (error) {
      console.error("Error setting up listeners:", error);
      setErrorMessage((error as any)?.message || "監聽器建立失敗");
      setLoading(false);
    }
  };

  const triggerAnalysisUpdate = (meals: any[], exercises: any[], profile: any) => {
    // Clear previous timeout
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Debounce: wait 2 seconds before updating to avoid too many API calls
    analysisTimeoutRef.current = setTimeout(() => {
      updateAnalysis(meals, exercises, profile);
    }, 2000);

    // Update week data immediately for charts
    updateWeekData(meals, exercises, profile);
  };

  const updateWeekData = (meals: any[], exercises: any[], profile: any) => {
    // Group data by day
    const dailyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayMeals = meals.filter(m => {
        const mealDate = m.timestamp?.toDate();
        return mealDate >= dayStart && mealDate <= dayEnd;
      });

      const dayExercises = exercises.filter(e => {
        const exerciseDate = e.timestamp?.toDate();
        return exerciseDate >= dayStart && exerciseDate <= dayEnd;
      });

      const totalCalories = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const totalBurn = dayExercises.reduce((sum, e) => sum + (e.calories || 0), 0);

      dailyData.push({
        date: date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
        calories: totalCalories,
        burn: totalBurn,
        net: totalCalories - totalBurn,
        meals: dayMeals.length,
        exercises: dayExercises.length
      });
    }

    setWeekData({
      meals,
      exercises,
      profile,
      dailyData
    });
  };

  const updateAnalysis = async (meals: any[], exercises: any[], profile: any) => {
    setGenerating(true);
    try {
      console.log("Analysis: calling AI for update - meals:", meals.length, "exercises:", exercises.length);
      const [aiAnalysis, knowledge] = await Promise.all([
        getWeeklyAnalysis({ meals, exercises, profile }),
        getAcademicKnowledge(meals, exercises, profile)
      ]);
      console.log("Analysis: AI response received (lengths):", aiAnalysis?.length, knowledge?.length);
      setAnalysis(aiAnalysis);
      setAcademicTips(knowledge);
    } catch (error) {
      console.error("Error generating analysis:", error);
      setErrorMessage((error as any)?.message || "AI 產生失敗");
    } finally {
      setGenerating(false);
    }
  };

  const handleRefresh = async () => {
    if (!weekData) return;
    await updateAnalysis(weekData.meals, weekData.exercises, weekData.profile);
  };

  const totalStats = weekData ? {
    totalMeals: weekData.meals.length,
    totalExercises: weekData.exercises.length,
    avgCalories: Math.round(weekData.dailyData.reduce((sum: number, d: any) => sum + d.calories, 0) / 7),
    avgBurn: Math.round(weekData.dailyData.reduce((sum: number, d: any) => sum + d.burn, 0) / 7)
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {errorMessage && (
          <div className="mb-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded">錯誤：{errorMessage}</div>
          </div>
        )}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('analysis.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('analysis.subtitle')}</p>
        </div>

        {/* Stats Summary */}
        {totalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{totalStats.totalMeals}</div>
                  <div className="text-sm text-muted-foreground">{t('analysis.totalMeals')}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{totalStats.totalExercises}</div>
                      <div className="text-sm text-muted-foreground">{t('analysis.totalExercises')}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{totalStats.avgCalories}</div>
                  <div className="text-sm text-muted-foreground">{t('analysis.avgIntake')}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-destructive mb-1">{totalStats.avgBurn}</div>
                  <div className="text-sm text-muted-foreground">{t('analysis.avgBurn')}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        {weekData?.dailyData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('analysis.caloriesTrend')}</CardTitle>
                <CardDescription>{t('analysis.caloriesTrendDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calories" stroke="hsl(var(--primary))" name="攝取" strokeWidth={2} />
                    <Line type="monotone" dataKey="burn" stroke="hsl(var(--destructive))" name="消耗" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('analysis.activityLevel')}</CardTitle>
                <CardDescription>{t('analysis.activityLevelDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData.dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="meals" fill="hsl(var(--chart-1))" name="餐點" />
                    <Bar dataKey="exercises" fill="hsl(var(--chart-2))" name="運動" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Analysis */}
        <Card className="border-2 border-primary/20 mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary" />
                    <CardTitle>{t('analysis.aiAnalysis')}</CardTitle>
                  </div>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    disabled={generating}
                    className="gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('analysis.refreshing')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        {t('analysis.refresh')}
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription>{t('analysis.aiAnalysisDesc')}</CardDescription>
              </CardHeader>
          <CardContent>
            {analysis ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis}</p>
              </div>
                ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('analysis.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Academic Knowledge */}
        {academicTips.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Dna className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">{t('analysis.academicKnowledge')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {academicTips.map((tip, index) => (
                <Card key={index} className="hover:shadow-lg transition-all hover:border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{tip.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tip.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
