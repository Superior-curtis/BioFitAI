import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase";
import { getAIRecommendation } from "@/lib/openai";
import { Utensils, Dumbbell, TrendingUp, Brain, Loader2, Beaker } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useI18n } from "@/hooks/useI18n";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [meals, setMeals] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [aiRecommendation, setAIRecommendation] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadDashboardData();
      } else {
        // 用戶未登入，導向登入頁面
        navigate("/auth");
      }
    }
  }, [user, authLoading, navigate]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : null;
      setProfile(profileData);

      if (!profileData) {
        setLoading(false);
        navigate("/profile");
        return;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Query all meals for this user, then filter by today's date in client (avoid index requirement)
      const mealsQuery = query(
        collection(db, "meals"),
        where("userId", "==", user.uid)
      );
      const mealsSnapshot = await getDocs(mealsQuery);
      console.log("Dashboard: mealsSnapshot size:", mealsSnapshot.size);
      const mealsData = mealsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(meal => {
          const mealDate = meal.timestamp?.toDate?.();
          return mealDate && mealDate >= today;
        });
      setMeals(mealsData);

      // Query all exercises for this user, then filter by today's date in client
      const exercisesQuery = query(
        collection(db, "exercises"),
        where("userId", "==", user.uid)
      );
      const exercisesSnapshot = await getDocs(exercisesQuery);
      console.log("Dashboard: exercisesSnapshot size:", exercisesSnapshot.size);
      const exercisesData = exercisesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(exercise => {
          const exerciseDate = exercise.timestamp?.toDate?.();
          return exerciseDate && exerciseDate >= today;
        });
      setExercises(exercisesData);

      if (mealsData.length > 0 || exercisesData.length > 0) {
        const recommendation = await getAIRecommendation(mealsData, exercisesData, profileData);
        setAIRecommendation(recommendation);
      } else {
        setAIRecommendation("請先記錄您的餐點或運動，AI 才能為您生成建議！");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setErrorMessage((error as any)?.message || "載入資料發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const totalNutrition = meals.reduce((acc, meal) => ({ carbs: acc.carbs + (meal.carbs || 0), protein: acc.protein + (meal.protein || 0), fat: acc.fat + (meal.fat || 0), calories: acc.calories + (meal.calories || 0) }), { carbs: 0, protein: 0, fat: 0, calories: 0 });
  const nutritionData = [{ name: "碳水化合物", value: totalNutrition.carbs, color: "hsl(var(--chart-1))" }, { name: "蛋白質", value: totalNutrition.protein, color: "hsl(var(--chart-2))" }, { name: "脂肪", value: totalNutrition.fat, color: "hsl(var(--chart-3))" }].filter(item => item.value > 0);
  const totalBurn = exercises.reduce((sum, ex) => sum + (ex.calories || 0), 0);
  const caloriesData = [{ name: "攝取", value: totalNutrition.calories, fill: "hsl(var(--chart-1))" }, { name: "消耗", value: totalBurn, fill: "hsl(var(--destructive))" }];

  if (loading) {
    return (<div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5"><Navigation /><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></div>);
  }

  // 如果 profileData 已經是 null (因為 loadDashboardData 已經導向了 /profile)，這裡不需要額外處理
  // 否則，如果你需要一個開始使用的頁面而不是直接跳轉到 Profile 頁面，可以放一個按鈕在這裡
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {errorMessage && (
          <div className="mb-4">
            <div className="p-3 bg-destructive/10 text-destructive rounded">{t('common.error')}：{errorMessage}</div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button onClick={() => navigate("/meals")} className="h-auto py-6 flex-col gap-2" variant="outline"><Utensils className="w-8 h-8" /><span className="text-lg font-semibold">{t('dashboard.recordMeal')}</span></Button>
          <Button onClick={() => navigate("/exercise")} className="h-auto py-6 flex-col gap-2" variant="outline"><Dumbbell className="w-8 h-8" /><span className="text-lg font-semibold">{t('dashboard.recordExercise')}</span></Button>
          <Button onClick={() => navigate("/analysis")} className="h-auto py-6 flex-col gap-2" variant="outline"><Brain className="w-8 h-8" /><span className="text-lg font-semibold">{t('dashboard.aiAnalysis')}</span></Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card><CardHeader><CardTitle>{t('dashboard.nutritionRatio')}</CardTitle><CardDescription>{t('dashboard.nutritionRatioDesc')}</CardDescription></CardHeader><CardContent className="h-[300px]">{nutritionData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={nutritionData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value.toFixed(0)}g`} outerRadius={80} dataKey="value">{nutritionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full text-muted-foreground">{t('dashboard.noNutritionData')}</div>)}</CardContent></Card>
          <Card><CardHeader><CardTitle>{t('dashboard.calorieIntake')}</CardTitle><CardDescription>{t('dashboard.calorieIntakeDesc')}</CardDescription></CardHeader><CardContent className="h-[300px]">{totalNutrition.calories > 0 || totalBurn > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={caloriesData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="fill" name="熱量 (kcal)" /></BarChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full text-muted-foreground">{t('dashboard.noCalorieData')}</div>)}</CardContent></Card>
        </div>
        {aiRecommendation && (<Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background"><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-6 h-6 text-primary" />{t('dashboard.aiRecommendation')}</CardTitle><CardDescription>{t('dashboard.aiRecommendationDesc')}</CardDescription></CardHeader><CardContent><p className="text-foreground leading-relaxed whitespace-pre-wrap">{aiRecommendation}</p><Button onClick={() => navigate("/analysis")} variant="default" className="mt-4">{t('analysis.title')} →</Button></CardContent></Card>)}
        <div className="mb-8"><div className="flex items-center gap-3 mb-4"><Beaker className="w-6 h-6 text-primary" /><h2 className="text-2xl font-bold">{t('dashboard.academicKnowledge')}</h2></div><p className="text-muted-foreground mb-4">{t('analysis.aiAnalysisDesc')}</p><Button onClick={() => navigate("/analysis")} className="w-full md:w-auto">{t('analysis.title')}</Button></div>
        <Card><CardHeader><CardTitle>{t('dashboard.todaySummary')}</CardTitle><CardDescription>{t('dashboard.todaySummary')}</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="text-center p-4 bg-accent/10 rounded-lg"><div className="text-sm text-muted-foreground mb-1">{t('dashboard.totalIntake')}</div><div className="text-2xl font-bold text-primary">{totalNutrition.calories.toFixed(0)} kcal</div></div><div className="text-center p-4 bg-accent/10 rounded-lg"><div className="text-sm text-muted-foreground mb-1">{t('dashboard.totalBurn')}</div><div className="text-2xl font-bold text-destructive">{totalBurn.toFixed(0)} kcal</div></div><div className="text-center p-4 bg-accent/10 rounded-lg"><div className="text-sm text-muted-foreground mb-1">{t('dashboard.netIntake')}</div><div className="text-2xl font-bold">{(totalNutrition.calories - totalBurn).toFixed(0)} kcal</div></div><div className="text-center p-4 bg-accent/10 rounded-lg"><div className="text-sm text-muted-foreground mb-1">{t('dashboard.mealsExercises')}</div><div className="text-2xl font-bold text-primary">{meals.length}/{exercises.length}</div></div></div></CardContent></Card>
      </div>
    </div>
  );
};

export default Dashboard;