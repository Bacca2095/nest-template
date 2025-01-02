import 'dotenv/config';
import * as process from 'node:process';

import joi from 'joi';

interface EnvVariables {
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  PORT: number;
  OPENSEARCH_URL: string;
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
};
