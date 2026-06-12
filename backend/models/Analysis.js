import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  githubUrl: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  framework: {
    type: String,
    default: 'Unknown'
  },
  database: {
    type: String,
    default: 'Unknown'
  },
  dependencies: {
    type: [String],
    default: []
  },
  complexity: {
    type: String,
    default: 'Medium'
  },
  envVariables: {
    type: [String],
    default: []
  },
  dockerized: {
    type: Boolean,
    default: false
  },
  report: {
    type: Object,
    default: null
  },
  readiness: {
    type: Object,
    default: null
  },
  risks: {
    type: Object,
    default: null
  },
  architectureReport: {
    type: Object,
    default: null
  },
  recommendation: {
    frontend: { type: String, default: '' },
    backend: { type: String, default: '' },
    reason: { type: String, default: '' },
    cost: { type: String, default: '' }
  },
  deploymentPlan: {
    steps: { type: [String], default: [] }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false
});

const MongoAnalysis = mongoose.modelNames().includes('Analysis')
  ? mongoose.model('Analysis')
  : mongoose.model('Analysis', AnalysisSchema);

// In-Memory Database Fallback Store
const memoryStore = [];

/**
 * Dual-mode database class wrapper.
 * Mimics Mongoose constructor and query methods.
 */
function Analysis(data) {
  if (mongoose.connection.readyState === 1) {
    return new MongoAnalysis(data);
  }
  
  // Return in-memory document instance
  return {
    _id: 'mem_' + Math.random().toString(36).substr(2, 9),
    githubUrl: data.githubUrl || '',
    framework: data.framework || 'Unknown',
    database: data.database || 'None',
    dependencies: data.dependencies || [],
    complexity: data.complexity || 'Medium',
    envVariables: data.envVariables || [],
    dockerized: data.dockerized || false,
    report: data.report || null,
    readiness: data.readiness || null,
    risks: data.risks || null,
    architectureReport: data.architectureReport || null,
    recommendation: data.recommendation || { frontend: '', backend: '', reason: '', cost: '' },
    deploymentPlan: data.deploymentPlan || { steps: [] },
    createdAt: new Date(),
    save: async function() {
      const idx = memoryStore.findIndex(item => item.githubUrl === this.githubUrl);
      if (idx !== -1) {
        memoryStore[idx] = this;
      } else {
        memoryStore.push(this);
      }
      return this;
    }
  };
}

// Static findOne method
Analysis.findOne = async (query) => {
  if (mongoose.connection.readyState === 1) {
    return MongoAnalysis.findOne(query);
  }
  return memoryStore.find(item => {
    if (query.githubUrl && item.githubUrl === query.githubUrl) return true;
    if (query._id && item._id === query._id) return true;
    return false;
  }) || null;
};

// Static countDocuments method
Analysis.countDocuments = async (query = {}) => {
  if (mongoose.connection.readyState === 1) {
    return MongoAnalysis.countDocuments(query);
  }
  if (Object.keys(query).length === 0) {
    return memoryStore.length;
  }
  
  // Basic query mapping for stats
  if (query['recommendation.frontend'] === 'Vercel') {
    return memoryStore.filter(i => i.recommendation?.frontend === 'Vercel').length;
  }
  if (query['recommendation.backend'] === 'Render') {
    return memoryStore.filter(i => i.recommendation?.backend === 'Render').length;
  }
  return memoryStore.length;
};

// Static find method (returns chainable cursor mock)
Analysis.find = (query = {}) => {
  if (mongoose.connection.readyState === 1) {
    return MongoAnalysis.find(query);
  }
  
  const results = [...memoryStore].sort((a, b) => b.createdAt - a.createdAt);
  
  const chain = {
    select: () => chain,
    sort: () => chain,
    limit: (n) => Promise.resolve(results.slice(0, n)),
    then: (resolve) => resolve(results)
  };
  
  return chain;
};

export default Analysis;
