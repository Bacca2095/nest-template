import 'dotenv/config';
import * as process from 'node:process';

import joi from 'joi';

interface EnvVariables {
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: number;
  OPENSEARCH_URL: string;
  CONTABO_CLIENT_ID: string;
  CONTABO_CLIENT_SECRET: string;
  CONTABO_API_USER: string;
  CONTABO_API_PASSWORD: string;
  CONTABO_AUTH_URL: string;
  CONTABO_API_URL: string;
  CONTABO_DEFAULT_SSH_ID: number;
}

const envSchema: joi.ObjectSchema<EnvVariables> = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    NODE_ENV: joi
      .string()
      .valid('development', 'production', 'test')
      .default('development'),
    OPENSEARCH_URL: joi.string().required(),
    CONTABO_CLIENT_ID: joi.string().required(),
    CONTABO_CLIENT_SECRET: joi.string().required(),
    CONTABO_API_USER: joi.string().required(),
    CONTABO_API_PASSWORD: joi.string().required(),
    CONTABO_AUTH_URL: joi.string().uri().required(),
    CONTABO_API_URL: joi.string().uri().required(),
    CONTABO_DEFAULT_SSH_ID: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envSchema.validate({ ...process.env }, {});
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
const envVars: EnvVariables = value;

export const environment = {
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,
  jwtSecret: envVars.JWT_SECRET,
  nodeEnv: envVars.NODE_ENV,
  opensearchUrl: envVars.OPENSEARCH_URL,
  contaboClientId: envVars.CONTABO_CLIENT_ID,
  contaboClientSecret: envVars.CONTABO_CLIENT_SECRET,
  contaboApiUser: envVars.CONTABO_API_USER,
  contaboApiPassword: envVars.CONTABO_API_PASSWORD,
  contaboAuthUrl: envVars.CONTABO_AUTH_URL,
  contaboApiUrl: envVars.CONTABO_API_URL,
  contaboDefaultSshId: envVars.CONTABO_DEFAULT_SSH_ID,
};
