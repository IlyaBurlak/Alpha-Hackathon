
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alpha Hackathon API',
      version: '1.0.0',
      description: 'API для пользователей, заявок и поддержки',
    },
    tags: [
      { name: 'Users', description: 'Авторизация и данные текущего пользователя' },
      { name: 'Applications', description: 'Кредитные заявки пользователя' },
      { name: 'Support', description: 'Сервис поддержки' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 2 },
            inn: { type: 'string', example: '5001234569' },
            fullName: { type: 'string', example: 'ООО "Кот не знает"' },
            type: { type: 'string', example: 'OO' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 2 },
            login: { type: 'string', example: 'alfaAngelika' },
            fullName: { type: 'string', example: 'Василенко Анжелика' },
            organizations: {
              type: 'array',
              items: { $ref: '#/components/schemas/Organization' },
            },
          },
        },
        CreditTime: {
          type: 'object',
          required: ['units', 'value'],
          properties: {
            units: { type: 'string', enum: ['DAY', 'MONTH', 'YEAR'], example: 'YEAR' },
            value: { type: 'integer', minimum: 1, example: 1 },
          },
        },
        ApplicationCreate: {
          type: 'object',
          required: ['organizationId', 'sum', 'creditTime'],
          properties: {
            organizationId: { type: 'integer', example: 2 },
            sum: { type: 'number', format: 'float', example: 100000000 },
            creditTime: { $ref: '#/components/schemas/CreditTime' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 2 },
            organizationId: { type: 'integer', example: 2 },
            sum: { type: 'number', format: 'float', example: 100000000 },
            status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], example: 'DRAFT' },
            createdAt: { type: 'string', format: 'date-time' },
            creditTime: { $ref: '#/components/schemas/CreditTime' },
            loanIssuanceDate: { type: 'string', format: 'date-time' },
          },
        },
      },
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