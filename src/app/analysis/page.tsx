
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getAthletes } from "@/lib/data";
import type { Athlete } from '@/types';
import { Lightbulb, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Mock comments and analysis
const mockComments: Record<string, { date: string, comment: string }[]> = {
  '1': [{ date: '2023-05-10', comment: 'עבודה טובה על חבטות הכף יד.' }, { date: '2023-05-12', comment: 'צריך לשפר את עבודת הרגליים.' }],
  '2': [{ date: '2023-05-11', comment: 'ריכוז גבוה באימון, כל הכבוד!' }],
  '3': [{ date: '2023-05-15', comment: 'הראה התקדמות יפה בהגנה.' }, { date: '2023-05-17', comment: 'נראה עייף מעט היום.' }],
};

const mockAnalysis = {
  themes: ['עבודת רגליים', 'ריכוז', 'חבטות', 'הגנה'],
  sentiment: 'מעורב',
  summary: 'הספורטאי מראה התקדמות טובה בתחומים טכניים אך נדרש שיפור בריכוז ועבודת הרגליים עקבית.',
};

export default function AnalysisPage() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<typeof mockAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(true);

  useEffect(() => {
    async function fetchAthletes() {
        setLoadingAthletes(true);
        const athletesData = await getAthletes();
        setAthletes(athletesData);
        setLoadingAthletes(false);
    }
    fetchAthletes();
  }, []);

  const handleAnalyze = () => {
    if (!selectedAthleteId) return;
    setIsLoading(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResult(mockAnalysis);
      setIsLoading(false);
    }, 1500);
  };

  const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
    switch (sentiment) {
      case 'חיובי': return <ThumbsUp className="w-5 h-5 text-green-500" />;
      case 'שלילי': return <ThumbsDown className="w-5 h-5 text-red-500" />;
      default: return <Meh className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>בחר ספורטאי</CardTitle>
          <CardDescription>בחר ספורטאי כדי לנתח את הערות המאמן לגביו.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={setSelectedAthleteId} disabled={loadingAthletes}>
            <SelectTrigger>
              <SelectValue placeholder={loadingAthletes ? "טוען ספורטאים..." : "בחר ספורטאי..."} />
            </SelectTrigger>
            <SelectContent>
              {athletes.map(athlete => (
                <SelectItem key={athlete.id} value={athlete.id}>{`${athlete.firstName} ${athlete.lastName}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAnalyze} disabled={!selectedAthleteId || isLoading} className="w-full">
            <Lightbulb className="me-2 h-4 w-4" />
            {isLoading ? 'מנתח...' : 'נתח הערות'}
          </Button>
        </CardContent>
        {selectedAthleteId && (
            <CardFooter className="flex flex-col items-start gap-2">
                 <h3 className="font-semibold mt-4">הערות אחרונות</h3>
                 <Separator/>
                <ScrollArea className="h-48 w-full">
                    <div className="space-y-4 p-2">
                    {(mockComments[selectedAthleteId] || [{date: '', comment: 'אין הערות זמינות'}]).map((c, i) => (
                        <div key={i}>
                            <p className="text-sm font-medium">{c.comment}</p>
                            <p className="text-xs text-muted-foreground">{c.date}</p>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </CardFooter>
        )}
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>תוצאות הניתוח</CardTitle>
          <CardDescription>
            {analysisResult ? 'סיכום התמות והסנטימנט מהערות המאמן.' : 'תוצאות הניתוח יוצגו כאן.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Lightbulb className="h-12 w-12 animate-pulse text-primary" />
            </div>
          ) : analysisResult ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">סיכום כללי</h3>
                <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
              </div>
              <div className="flex items-center gap-4">
                <h3 className="font-semibold">סנטימנט כללי:</h3>
                <Badge variant="outline" className="flex items-center gap-2 text-base py-1 px-3">
                  <SentimentIcon sentiment={analysisResult.sentiment} />
                  <span>{analysisResult.sentiment}</span>
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">תמות מרכזיות</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.themes.map(theme => (
                    <Badge key={theme} variant="secondary">{theme}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>בחר ספורטאי ולחץ על "נתח הערות" כדי לראות את התוצאות.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
