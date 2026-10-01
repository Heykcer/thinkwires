import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { jobRouter } from './job.routes.js';
import { candidateRouter } from './candidate.routes.js';
import { benchRouter } from './bench.routes.js';
import { aiRouter } from './ai.routes.js';

export const apiV1Router = Router();

// Mount individual sub-routers
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/jobs', jobRouter);
apiV1Router.use('/candidates', candidateRouter);
apiV1Router.use('/bench', benchRouter);
apiV1Router.use('/ai', aiRouter);

// Health check under /api/v1/health
apiV1Router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'thinkwire-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Admin CMS Feature Flags
apiV1Router.get('/admin/feature-flags', (req, res) => {
  res.status(200).json({
    success: true,
    flags: [
      {
        key: 'ai_screening_gatekeeper',
        name: 'AI Screening Gatekeeper',
        isEnabled: true,
        targetRole: 'all',
      },
      {
        key: 'resume_match_scorer',
        name: 'Resume Match Scorer',
        isEnabled: true,
        targetRole: 'client',
      },
      {
        key: 'bench_management',
        name: 'Bench Management',
        isEnabled: true,
        targetRole: 'admin',
      },
      {
        key: 'stripe_invoicing',
        name: 'Stripe Billing & Invoicing',
        isEnabled: false,
        targetRole: 'client',
      },
    ],
  });
});
