// serverless.ts
import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'portfolio-backend-aws',
  
  frameworkVersion: '3',
  
  provider: {
    name: 'aws',
    runtime: 'nodejs18.x',
    stage: 'dev',
    region: 'us-east-1',
    
    environment: {
      NODE_ENV: '${opt:stage, "dev"}',
      SERVICE_NAME: 'portfolio-backend',
    },
    
    httpApi: {
      cors: true,
    },
  },
  
  functions: {
    health: {
      handler: 'src/handlers/health.handler',
      events: [
        {
          httpApi: {
            path: '/',
            method: 'get',
          },
        },
      ],
    },
    
    contact: {
      handler: 'src/handlers/contact.handler',
      events: [
        {
          httpApi: {
            path: '/contact',
            method: 'post',
          },
        },
      ],
      environment: {
        CONTACT_TABLE: 'contacts-${sls:stage}',
      },
    },
  },
  
  plugins: ['serverless-offline'],
  
  custom: {
    'serverless-offline': {
      httpPort: 3000,
      noPrependStageInUrl: true,
    },
  },
};

module.exports = serverlessConfiguration;