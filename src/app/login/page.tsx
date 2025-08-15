
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
  
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const verifier = getRecaptchaVerifier('recaptcha-container');
        if (!verifier) {
            throw new Error("Could not create reCAPTCHA verifier");
        }
        // Firebase requires the phone number in E.164 format (e.g., +972501234567)
        // We assume Israeli numbers if no country code is provided.
        const formattedPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+972${phoneNumber.substring(1)}`;
        
        const result = await signInWithPhoneNumber(auth, formattedPhoneNumber, verifier);
        setConfirmationResult(result);
        toast({
            title: "קוד אימות נשלח",
            description: "אנא הזן את הקוד שקיבלת ב-SMS.",
        });
    } catch (error: any) {
        console.error("Error sending OTP", error);
        toast({
            title: "שגיאה בשליחת הקוד",
            description: error.message,
            variant: "destructive",
        });
        // Reset reCAPTCHA
        if ((window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier.render().then((widgetId: any) => {
                grecaptcha.reset(widgetId);
            });
        }
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
        router.push('/');
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
