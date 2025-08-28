
'use server';

/**
 * @fileOverview An AI flow for analyzing coach's comments about an athlete.
 * 
 * - analyzeAthleteComments - Analyzes a list of comments to produce a summary, sentiment, and themes.
 * - CommentAnalysisInput - The input type for the analysis function.
 * - CommentAnalysisOutput - The return type for the analysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CommentAnalysisInputSchema = z.object({
  comments: z.array(z.string()).describe('A list of comments from a coach about an athlete.'),
});
export type CommentAnalysisInput = z.infer<typeof CommentAnalysisInputSchema>;

const CommentAnalysisOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the athlete\'s performance and progress based on the comments. Should be in Hebrew.'),
  sentiment: z.enum(['חיובי', 'שלילי', 'מעורב']).describe('The overall sentiment of the comments.'),
  themes: z.array(z.string()).describe('A list of key themes or topics that frequently appear in the comments. For example: "עבודת רגליים", "ריכוז", "גישה". Should be in Hebrew.'),
});
export type CommentAnalysisOutput = z.infer<typeof CommentAnalysisOutputSchema>;


export async function analyzeAthleteComments(input: CommentAnalysisInput): Promise<CommentAnalysisOutput> {
    // If there are no comments, return a default empty-like state.
    if (input.comments.length === 0) {
        return {
            summary: "לא נמצאו הערות לניתוח. לא ניתן להפיק סיכום.",
            sentiment: "מעורב",
            themes: []
        };
    }
    return commentAnalysisFlow(input);
}


const prompt = ai.definePrompt({
    name: 'commentAnalysisPrompt',
    input: { schema: CommentAnalysisInputSchema },
    output: { schema: CommentAnalysisOutputSchema },
    prompt: `
        You are a professional sports analyst for a badminton coach. 
        Your task is to analyze a list of comments about a single athlete and provide a structured analysis in Hebrew.
        
        Based on the following comments, please do the following:
        1.  Write a brief summary of the athlete's progress, strengths, and areas for improvement.
        2.  Determine the overall sentiment of the comments. It can be 'חיובי' (positive), 'שלילי' (negative), or 'מעורב' (mixed).
        3.  Identify and list the main recurring themes.

        Here are the comments:
        {{#each comments}}
        - "{{this}}"
        {{/each}}
    `,
});


const commentAnalysisFlow = ai.defineFlow(
  {
    name: 'commentAnalysisFlow',
    inputSchema: CommentAnalysisInputSchema,
    outputSchema: CommentAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid analysis.');
    }
    return output;
  }
);
