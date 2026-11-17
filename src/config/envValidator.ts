import dotenv from 'dotenv';

// load env variables
dotenv.config();

// validate required environment variables
export const validateEnv = () => {
  const requiredEnvVars = ['PORT', 'MONGODB_URI'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`missing required env variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
};
