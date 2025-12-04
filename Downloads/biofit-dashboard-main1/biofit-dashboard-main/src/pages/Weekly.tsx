import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getWeeklyAnalysis } from "@/lib/openai";
import { Calendar, TrendingUp, Loader2, Brain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useI18n } from "@/hooks/useI18n";

const Weekly = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [weekData, setWeekData] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWeeklyData();
  }, [user, navigate]);

  const loadWeeklyData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get data from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Fetch meals
      const mealsQuery = query(
        collection(db, "meals"),
        where("userId", "==", user.uid),
        where("timestamp", ">=", sevenDaysAgo),
        orderBy("timestamp", "desc")
      );
      const mealsSnapshot = await getDocs(mealsQuery);
      const meals = mealsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));

      // Fetch exercises
      const exercisesQuery = query(
        collection(db, "exercises"),
        where("userId", "==", user.uid),
        where("timestamp", ">=", sevenDaysAgo),
        orderBy("timestamp", "desc")
      );
      const exercisesSnapshot = await getDocs(exercisesQuery);
      const exercises = exercisesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      }));

      // Fetch profile
      const profileSnapshot = await getDocs(
        query(collection(db, "profiles"), where("__name__", "==", user.uid))
      );
      const profile = profileSnapshot.docs[0]?.data();

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

      // Get AI analysis
      const aiAnalysis = await getWeeklyAnalysis({ meals, exercises, profile });
      setAnalysis(aiAnalysis);
    } catch (error) {
      console.error("Error loading weekly data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalStats = weekData ? {
    totalMeals: weekData.meals.length,
    totalExercises: weekData.exercises.length,
    avgCalories: Math.round(weekData.dailyData.reduce((sum: number, d: any) => sum + d.calories, 0) / 7),
    avgBurn: Math.round(weekData.dailyData.reduce((sum: number, d: any) => sum + d.burn, 0) / 7)
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('analysis.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('analysis.subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-lg">{t('common.loading')}</span>
          </div>
        ) : (
          <>
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
                    <CardTitle>每日熱量趨勢</CardTitle>
                    <CardDescription>過去七天的攝取與消耗</CardDescription>
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
                    <CardTitle>每日活動量</CardTitle>
                    <CardDescription>餐點與運動記錄次數</CardDescription>
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
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  AI 週報分析
                </CardTitle>
                <CardDescription>基於您本週數據的專業建議</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{analysis}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">尚無足夠數據生成週報分析</p>
                    <Button onClick={loadWeeklyData} className="mt-4">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      重新生成分析
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Weekly;
