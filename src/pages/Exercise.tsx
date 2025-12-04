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
import { Dumbbell, Plus, Trash2, Flame, Brain } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import Navigation from "@/components/Navigation";

interface Exercise {
  id: string;
  name: string;
  duration: number;
  calories: number;
  timestamp: Date;
}

const Exercise = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");

  useEffect(() => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "exercises"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exercisesData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate(),
        }))
        .filter(exercise => exercise.timestamp >= today) as Exercise[];
      setExercises(exercisesData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: t('exercise.loginRequired'),
        description: t('exercise.loginRequiredDesc'),
        variant: "destructive",
      });
      return;
    }
    
    const newExercise = {
      userId: user.uid,
      name: exerciseName,
      duration: parseInt(duration),
      calories: parseFloat(calories),
      timestamp: Timestamp.now(),
    };

    try {
      await addDoc(collection(db, "exercises"), newExercise);
      toast({
        title: t('exercise.exerciseAdded'),
        description: `${exerciseName} - ${duration} 分鐘`,
      });
      
      setExerciseName("");
      setDuration("");
      setCalories("");

      // Auto-navigate to analysis after 1 second
      setTimeout(() => {
        navigate("/analysis");
      }, 1000);
    } catch (error: any) {
      toast({
        title: t('exercise.addFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteExercise = async (id: string) => {
    try {
      await deleteDoc(doc(db, "exercises", id));
      toast({
        title: t('exercise.exerciseDeleted'),
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: t('exercise.deleteFailed'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalStats = exercises.reduce(
    (acc, exercise) => ({
      duration: acc.duration + exercise.duration,
      calories: acc.calories + exercise.calories,
    }),
    { duration: 0, calories: 0 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('exercise.title')}</h1>
            <p className="text-muted-foreground">{t('exercise.subtitle')}</p>
          </div>
          <Button onClick={() => navigate("/analysis")} variant="outline" className="gap-2">
            <Brain className="w-4 h-4" />
            {t('exercise.viewAnalysis')}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                {t('exercise.addExercise')}
              </CardTitle>
              <CardDescription>{t('exercise.addExerciseDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddExercise} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise-name">{t('exercise.exerciseName')}</Label>
                  <Input
                    id="exercise-name"
                    placeholder={t('exercise.exerciseNamePlaceholder')}
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration">{t('exercise.duration')}</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder={t('exercise.durationPlaceholder')}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="calories">{t('exercise.calories')}</Label>
                    <Input
                      id="calories"
                      type="number"
                      step="0.1"
                      placeholder={t('exercise.caloriesPlaceholder')}
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('exercise.addButton')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                {t('exercise.todayTotal')}
              </CardTitle>
              <CardDescription>{t('exercise.exerciseStats')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                  <span className="font-medium flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    {t('exercise.totalBurn')}
                  </span>
                  <span className="text-2xl font-bold text-destructive">
                    {totalStats.calories.toFixed(0)} kcal
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-card rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">{t('exercise.count')}</div>
                    <div className="text-xl font-bold">{exercises.length} 次</div>
                  </div>
                  <div className="text-center p-3 bg-card rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">{t('exercise.totalDuration')}</div>
                    <div className="text-xl font-bold">{totalStats.duration} 分</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('exercise.exerciseRecords')}</CardTitle>
            <CardDescription>
              {exercises.length === 0 ? t('exercise.noRecords') : `${t('exercise.exerciseRecords')}: ${exercises.length}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('exercise.startRecording')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-4 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{exercise.name}</h4>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span>{t('exercise.duration')} {exercise.duration} 分鐘</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {exercise.calories} kcal
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExercise(exercise.id)}
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

export default Exercise;
