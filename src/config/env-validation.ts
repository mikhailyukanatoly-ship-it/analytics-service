import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().default('develop'),

  NAME: Joi.string().default('service'),

  PORT: Joi.number().default(3001),

  DATABASE_HOST: Joi.string().hostname().required(),
  DATABASE_PORT: Joi.number().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
});
