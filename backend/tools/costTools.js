import { FunctionTool } from '@google/adk';
import { z } from 'zod';

export const calculateCostsTool = new FunctionTool({
  name: 'calculateCosts',
  description: 'Estimates monthly hosting costs across Vercel, Render, and MongoDB Atlas based on project size and databases.',
  parameters: z.object({
    framework: z.string().describe('Detected framework, e.g. React or Express'),
    database: z.string().describe('Detected database type, e.g. MongoDB, SQLite, or None'),
    scale: z.enum(['free', 'staging', 'production']).default('free').describe('Target deployment scale tier')
  }),
  execute: async ({ framework, database, scale }) => {
    let frontendCost = 0;
    let backendCost = 0;
    let dbCost = 0;

    let frontendPlan = 'Free Hobby';
    let backendPlan = 'Free Web Service';
    let dbPlan = 'Shared Tenant';

    if (scale === 'free') {
      frontendCost = 0;
      backendCost = 0;
      dbCost = 0;
    } else if (scale === 'staging') {
      frontendCost = 20; // Vercel Pro
      frontendPlan = 'Pro Tier';
      backendCost = 7; // Render Starter
      backendPlan = 'Starter Web Service';
      dbCost = 9; // Mongo Atlas M2 Shared
      dbPlan = 'Shared Dedicated M2';
    } else if (scale === 'production') {
      frontendCost = 20; // Vercel Pro base
      frontendPlan = 'Pro Enterprise Base';
      backendCost = 25; // Render Standard
      backendPlan = 'Standard Web Service';
      dbCost = 60; // Mongo Atlas Dedicated M10
      dbPlan = 'Dedicated M10 Cluster';
    }

    const total = frontendCost + backendCost + dbCost;

    return {
      success: true,
      frontend: { provider: 'Vercel', plan: frontendPlan, monthlyCost: `$${frontendCost}/mo` },
      backend: { provider: 'Render', plan: backendPlan, monthlyCost: `$${backendCost}/mo` },
      database: { provider: 'MongoDB Atlas', plan: dbPlan, monthlyCost: `$${dbCost}/mo` },
      totalEstimatedCost: `$${total}/month`
    };
  }
});
