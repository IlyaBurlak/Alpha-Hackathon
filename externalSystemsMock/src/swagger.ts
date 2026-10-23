
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Support API',
      version: '1.0.0',
      description: 'API для поддержки',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
        description: 'Локальный сервер',
      },
    ],
  },

  apis: ['./src/api/**/*.ts', './src/api/**/**/*.ts'], 
};

export const swaggerSpec = swaggerJsdoc(options);