import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Utensils, Plus, Trash2, Brain } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useI18n } from "@/hooks/useI18n";

interface Meal {
  id: string;
  name: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
  timestamp: Date;
}

const Meals = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealName, setMealName] = useState("");
  const [carbs, setCarbs] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");

  useEffect(() => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "meals"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mealsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        }))
        .filter(meal => meal.timestamp >= today) as Meal[];
      setMeals(mealsData);
    });

    return () => unsubscribe();
  }, [user]);

  const calculateCalories = (c: number, p: number, f: number) => {
    return c * 4 + p * 4 + f * 9;
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: t('meals.loginRequired'),
        description: t('meals.loginRequiredDesc'),
        variant: "destructive",
      });
      return;
    }
    
    const carbsNum = parseFloat(carbs);
    const proteinNum = parseFloat(protein);
    const fatNum = parseFloat(fat);
    
    const newMeal = {
      userId: user.uid,
      name: mealName,
      carbs: carbsNum,
      protein: proteinNum,
      fat: fatNum,
      calories: calculateCalories(carbsNum, proteinNum, fatNum),
      timestamp: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, "meals"), newMeal);
      toast({
        title: t('meals.mealAdded'),
        description: `${mealName} - ${newMeal.calories.toFixed(0)} kcal`,
      });
      
      setMealName("");
      setCarbs("");
      setProtein("");
      setFat("");

      // Auto-navigate to analysis after 1 second
      setTimeout(() => {
        navigate("/analysis");
      }, 1000);
    } catch (error: any) {
      toast({
        title: t('meals.addFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMeal = async (id: string) => {
    try {
      await deleteDoc(doc(db, "meals", id));
      toast({
        title: t('meals.mealDeleted'),
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: t('meals.deleteFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalNutrition = meals.reduce(
    (acc, meal) => ({
      carbs: acc.carbs + meal.carbs,
      protein: acc.protein + meal.protein,
      fat: acc.fat + meal.fat,
      calories: acc.calories + meal.calories,
    }),
    { carbs: 0, protein: 0, fat: 0, calories: 0 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('meals.title')}</h1>
            <p className="text-muted-foreground">{t('meals.subtitle')}</p>
          </div>
          <Button onClick={() => navigate("/analysis")} variant="outline" className="gap-2">
            <Brain className="w-4 h-4" />
            {t('meals.viewAnalysis')}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {t('meals.addMeal')}
              </CardTitle>
              <CardDescription>{t('meals.addMealDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMeal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meal-name">{t('meals.foodName')}</Label>
                  <Input
                    id="meal-name"
                    placeholder={t('meals.foodNamePlaceholder')}
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="carbs">{t('meals.carbs')}</Label>
                    <Input
                      id="carbs"
                      type="number"
                      step="0.1"
                      placeholder={t('meals.carbsPlaceholder')}
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="protein">{t('meals.protein')}</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      placeholder={t('meals.proteinPlaceholder')}
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fat">{t('meals.fat')}</Label>
                    <Input
                      id="fat"
                      type="number"
                      step="0.1"
                      placeholder={t('meals.fatPlaceholder')}
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('meals.addButton')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                {t('meals.todayTotal')}
              </CardTitle>
              <CardDescription>{t('meals.nutritionStats')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-accent/20 rounded-lg">
                  <span className="font-medium">{t('meals.totalCalories')}</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalNutrition.calories.toFixed(0)} kcal
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-card rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">{t('meals.carbohydrates')}</div>
                    <div className="text-xl font-bold">{totalNutrition.carbs.toFixed(1)}g</div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">{t('meals.totalProtein')}</div>
                    <div className="text-xl font-bold">{totalNutrition.protein.toFixed(1)}g</div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">{t('meals.totalFat')}</div>
                    <div className="text-xl font-bold">{totalNutrition.fat.toFixed(1)}g</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('meals.mealRecords')}</CardTitle>
            <CardDescription>
              {meals.length === 0 ? t('meals.noRecords') : `${t('meals.mealRecords')}: ${meals.length}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {meals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Utensils className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('meals.startRecording')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-4 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{meal.name}</h4>
                      <div className="text-sm text-muted-foreground">
                        {t('meals.carbohydrates')} {meal.carbs}g • {t('meals.totalProtein')} {meal.protein}g • {t('meals.totalFat')} {meal.fat}g • {meal.calories.toFixed(0)} kcal
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="ml-4 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Meals;
