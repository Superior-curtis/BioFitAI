import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User, Ruler, Weight, Target } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [goal, setGoal] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: t('profile.loginRequired'),
        description: t('profile.loginRequiredDesc'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    // 檢查輸入是否為有效數字
    const parsedAge = parseInt(age);
    const parsedHeight = parseInt(height);
    const parsedWeight = parseFloat(weight);

    if (isNaN(parsedAge) || isNaN(parsedHeight) || isNaN(parsedWeight)) {
      toast({
        title: t('profile.inputErrorTitle'),
        description: t('profile.inputErrorDesc'),
        variant: "destructive",
      });
      return;
    }

    const userData = {
      name,
      age: parsedAge,
      gender,
      height: parsedHeight,
      weight: parsedWeight,
      goal,
      // 記錄用戶初次創建時間
      createdAt: new Date().toISOString(), 
    };

    try {
      // 儲存資料到 Firestore 的 'profiles' collection，文件 ID 為 user.uid
      await setDoc(doc(db, "profiles", user.uid), userData);
      
      toast({
        title: t('profile.saveSuccessTitle'),
        description: t('profile.saveSuccessDesc'),
      });
      
      navigate("/dashboard"); // 儲存成功後導向儀表板
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: t('profile.saveFailedTitle'),
        description: error.message || t('profile.saveFailedDesc'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('profile.basicInfo')}
                </CardTitle>
                <CardDescription>{t('profile.basicInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('profile.name')}</Label>
                  <Input
                    id="name"
                    placeholder={t('profile.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">{t('profile.age')}</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">{t('profile.gender')}</Label>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger id="gender">
                          <SelectValue placeholder={t('profile.selectGenderPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="male">{t('profile.male')}</SelectItem>
                          <SelectItem value="female">{t('profile.female')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="w-5 h-5" />
                  {t('profile.bodyData')}
                </CardTitle>
                <CardDescription>{t('profile.bodyDataDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="height" className="flex items-center gap-2">
                        <Ruler className="w-4 h-4" />
                          {t('profile.height')}
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        placeholder={t('profile.heightPlaceholder')}
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        required
                      />
                    </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                        {t('profile.weight')}
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder={t('profile.weightPlaceholder')}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t('profile.healthGoal')}
                </CardTitle>
                <CardDescription>{t('profile.healthGoalDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="goal">{t('profile.goal')}</Label>
                <Select value={goal} onValueChange={setGoal} required>
                  <SelectTrigger id="goal">
                    <SelectValue placeholder={t('profile.selectGoalPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fat_loss">{t('profile.goalOptions.fat_loss')}</SelectItem>
                    <SelectItem value="muscle_gain">{t('profile.goalOptions.muscle_gain')}</SelectItem>
                    <SelectItem value="maintain">{t('profile.goalOptions.maintain')}</SelectItem>
                    <SelectItem value="endurance">{t('profile.goalOptions.endurance')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">{t('profile.goalNote')}</p>
              </CardContent>
            </Card>
            
            <Button type="submit" className="w-full py-6 text-lg">
              {t('profile.saveButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;