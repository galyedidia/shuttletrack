
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, getRecaptchaVerifier } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLogo } from '@/components/icons';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Normalize Israeli / International phone numbers to clean E.164 format
  const formatPhoneNumber = (phone: string) => {
    const raw = phone.replace(/[^\d+]/g, '');
    if (raw.startsWith('+')) return raw;
    if (raw.startsWith('0')) return `+972${raw.substring(1)}`;
    if (raw.startsWith('972')) return `+${raw}`;
    return `+972${raw}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
        const verifier = getRecaptchaVerifier('recaptcha-container');
        if (!verifier) {
            throw new Error("לא ניתן לאתחל את שירות האבטחה (reCAPTCHA)");
        }
        
        if (!auth) {
            throw new Error("שירות האימות אינו זמין כעת");
        }
        const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, verifier);
        setConfirmationResult(result);
        toast({
            title: "קוד אימות נשלח",
            description: `קוד אימות נשלח למספר ${formattedPhoneNumber}. אנא הזן את הקוד.`,
        });
    } catch (error: any) {
        console.error("Error sending OTP", error);
        let errorDescription = error.message;
        if (error.code === 'auth/invalid-app-credential') {
            errorDescription = "שגיאת אימות הגדרות (auth/invalid-app-credential). יש לוודא שהאימות באמצעות טלפון מופעל ב-Firebase ושדומיין localhost מורשה.";
        } else if (error.code === 'auth/quota-exceeded') {
            errorDescription = "הגעת למגבלת ה-SMS של הפרויקט ב-Firebase.";
        } else if (error.code === 'auth/invalid-phone-number') {
            errorDescription = "מספר הטלפון שהוזן אינו בפורמט תקין.";
        }
        toast({
            title: "שגיאה בשליחת הקוד",
            description: errorDescription,
            variant: "destructive",
        });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!confirmationResult) return;
      setIsLoading(true);
      try {
        await confirmationResult.confirm(otp);
      } catch (error: any) {
        console.error("Error verifying OTP", error);
        toast({
            title: "שגיאה באימות הקוד",
            description: "הקוד שהוזן שגוי. אנא נסה שוב.",
            variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div id="recaptcha-container"></div>
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
               <AppLogo className="h-12 w-12 text-primary" />
            </div>
          <CardTitle className="text-2xl">ברוכים הבאים ל-ShuttleTrack</CardTitle>
          <CardDescription>
            {confirmationResult ? 'הזן את הקוד מ-SMS' : 'הזן את מספר הטלפון שלך כדי להתחבר'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!confirmationResult ? (
             <form onSubmit={handleSendOtp} className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="phone">מספר טלפון</Label>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="050-123-4567"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isLoading}
                />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'שולח...' : 'שלח קוד אימות'}
                </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="otp">קוד אימות</Label>
                <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={isLoading}
                    maxLength={6}
                />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'מאמת...' : 'התחבר'}
                </Button>
                 <Button variant="link" onClick={() => setConfirmationResult(null)}>
                    חזור למסך הטלפון
                </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
