import mongoose from 'mongoose';

const AgentSessionSchema = new mongoose.Schema({
  githubUrl: { type: String, required: true },
  sessionState: {
    framework: { type: String, default: '' },
    database: { type: String, default: '' },
    dependencies: [String],
    complexity: { type: String, default: 'Low' },
    envVariables: [String],
    envValues: { type: Map, of: String, default: {} },
    detectedRisks: [{
      severity: String,
      details: String,
      file: String
    }],
    vercelUrl: String,
    renderUrl: String,
    deploymentErrors: [String],
    healedAttempts: { type: Number, default: 0 }
  },
  workflowStep: { 
    type: String, 
    enum: ['idle', 'analyzing', 'securing', 'costing', 'deploying', 'monitoring', 'healing', 'completed', 'failed'], 
    default: 'idle' 
  },
  logs: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AgentSession', AgentSessionSchema);
