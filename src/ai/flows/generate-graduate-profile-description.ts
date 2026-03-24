'use server';
/**
 * @fileOverview A Genkit flow to generate a professional profile description for a graduate.
 *
 * - generateGraduateProfileDescription - A function that handles the profile description generation process.
 * - GenerateGraduateProfileDescriptionInput - The input type for the generateGraduateProfileDescription function.
 * - GenerateGraduateProfileDescriptionOutput - The return type for the generateGraduateProfileDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGraduateProfileDescriptionInputSchema = z.object({
  career: z.string().describe('The academic career of the graduate.'),
  experience: z.string().describe('A summary of the graduate\'s professional experience.'),
  keywords: z.array(z.string()).describe('A list of keywords relevant to the graduate\'s skills or interests.'),
});
export type GenerateGraduateProfileDescriptionInput = z.infer<typeof GenerateGraduateProfileDescriptionInputSchema>;

const GenerateGraduateProfileDescriptionOutputSchema = z.object({
  description: z.string().describe('A professionally generated profile description.'),
});
export type GenerateGraduateProfileDescriptionOutput = z.infer<typeof GenerateGraduateProfileDescriptionOutputSchema>;

const generateDescriptionPrompt = ai.definePrompt({
  name: 'generateGraduateProfileDescriptionPrompt',
  input: {schema: GenerateGraduateProfileDescriptionInputSchema},
  output: {schema: GenerateGraduateProfileDescriptionOutputSchema},
  prompt: `You are an expert professional profile writer. Your task is to generate a compelling and attractive professional description for a university graduate.

Use the following information:
Career: {{{career}}}
Experience: {{{experience}}}
Keywords: {{#each keywords}}- {{{this}}}
{{/each}}

Based on this information, create a professional description that highlights their strengths, accomplishments, and career aspirations. The description should be suitable for a professional networking platform profile. Aim for conciseness and impact.

Generate the description directly, without any introductory or concluding remarks.`,
});

const generateGraduateProfileDescriptionFlow = ai.defineFlow(
  {
    name: 'generateGraduateProfileDescriptionFlow',
    inputSchema: GenerateGraduateProfileDescriptionInputSchema,
    outputSchema: GenerateGraduateProfileDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateDescriptionPrompt(input);
    return output!;
  }
);

export async function generateGraduateProfileDescription(
  input: GenerateGraduateProfileDescriptionInput
): Promise<GenerateGraduateProfileDescriptionOutput> {
  return generateGraduateProfileDescriptionFlow(input);
}
