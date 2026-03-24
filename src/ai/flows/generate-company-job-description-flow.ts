'use server';
/**
 * @fileOverview This file implements a Genkit flow to assist companies in drafting job descriptions.
 *
 * - generateCompanyJobDescription - A function that generates a job description draft based on provided job details.
 * - GenerateCompanyJobDescriptionInput - The input type for the generateCompanyJobDescription function.
 * - GenerateCompanyJobDescriptionOutput - The return type for the generateCompanyJobDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCompanyJobDescriptionInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job position, e.g., "Software Engineer" or "Marketing Specialist".'),
  responsibilities: z
    .string()
    .describe('A summary of the main responsibilities for the job, e.g., "Develop and maintain web applications, collaborate with cross-functional teams."'),
  requirements: z
    .string()
    .describe('A summary of the required qualifications and skills for the job, e.g., "Bachelor\'s degree in Computer Science, 3+ years of experience with React and Node.js."'),
});
export type GenerateCompanyJobDescriptionInput = z.infer<typeof GenerateCompanyJobDescriptionInputSchema>;

const GenerateCompanyJobDescriptionOutputSchema = z.object({
  jobDescription: z
    .string()
    .describe('A clear, professional, and comprehensive draft of the job description, ready for review and publication.'),
});
export type GenerateCompanyJobDescriptionOutput = z.infer<typeof GenerateCompanyJobDescriptionOutputSchema>;

const generateJobDescriptionPrompt = ai.definePrompt({
  name: 'generateJobDescriptionPrompt',
  input: { schema: GenerateCompanyJobDescriptionInputSchema },
  output: { schema: GenerateCompanyJobDescriptionOutputSchema },
  prompt: `You are an expert HR professional and a skilled content writer. Your task is to generate a comprehensive and compelling job description draft.

Use the provided job title, responsibilities, and requirements to create a well-structured and professional job description. Ensure the description is clear, attractive to potential candidates, and covers all essential aspects of the role.

Job Title: {{{jobTitle}}}

Key Responsibilities:
{{{responsibilities}}}

Required Qualifications and Skills:
{{{requirements}}}

Draft the complete job description in Spanish, maintaining a formal and professional tone. Structure it with clear headings such as "Descripción del Puesto", "Responsabilidades Principales", "Requisitos" y "Ofrecemos" (or similar, if appropriate based on the context).`,
});

const generateCompanyJobDescriptionFlow = ai.defineFlow(
  {
    name: 'generateCompanyJobDescriptionFlow',
    inputSchema: GenerateCompanyJobDescriptionInputSchema,
    outputSchema: GenerateCompanyJobDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await generateJobDescriptionPrompt(input);
    return output!;
  }
);

export async function generateCompanyJobDescription(
  input: GenerateCompanyJobDescriptionInput
): Promise<GenerateCompanyJobDescriptionOutput> {
  return generateCompanyJobDescriptionFlow(input);
}
