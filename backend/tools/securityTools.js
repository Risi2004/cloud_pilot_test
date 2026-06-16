import { FunctionTool } from '@google/adk';
import { z } from 'zod';

export const securityScanTool = new FunctionTool({
  name: 'securityScan',
  description: 'Audits configuration arrays, dependencies, and environment keys to detect exposed credentials or secrets.',
  parameters: z.object({
    envKeys: z.array(z.string()).describe('List of environment variables to analyze'),
    envValues: z.any().optional().describe('Dictionary of environment values (checked for hardcoded values)')
  }),
  execute: async ({ envKeys, envValues = {} }) => {
    const findings = [];
    const sensitiveRegex = /(key|secret|pass|token|auth|cred|cert|private)/i;

    // Check environment variables names
    for (const key of envKeys) {
      if (sensitiveRegex.test(key)) {
        // Highlight that these are sensitive, need checking if they have default values
        const val = envValues[key];
        if (val && !val.startsWith('$') && !val.includes('mock') && !val.includes('demo') && val !== '********') {
          findings.push({
            severity: 'Critical',
            file: '.env',
            details: `Sensitive environment variable '${key}' contains a hardcoded plaintext secret.`
          });
        }
      }
    }

    // Default checklist verification
    if (envKeys.includes('PORT')) {
      const portVal = envValues['PORT'];
      if (portVal === '80' || portVal === '21') {
        findings.push({
          severity: 'Medium',
          file: 'Config',
          details: `Insecure port '${portVal}' is specified. Avoid running web apps directly on privilege-restricted system ports.`
        });
      }
    }

    if (findings.length === 0) {
      return {
        success: true,
        risks: [],
        message: 'No immediate hardcoded secrets or insecure ports identified in the scan.'
      };
    }

    return {
      success: true,
      risks: findings
    };
  }
});
