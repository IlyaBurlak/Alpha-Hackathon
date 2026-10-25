
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
            ogrn: { type: 'string', example: '1234567890124' },
            fullName: { type: 'string', example: 'ООО "Кот не знает"' },
            head: { type: 'string', nullable: true },
            account: { type: 'string', example: '4015****23' },
            address: { type: 'string', nullable: true },
            type: { type: 'string', example: 'OO' },
          },
        },
        Error: {
          type: 'object',
          properties: { error: { type: 'string', example: 'Доступ запрещен' } },
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
            productId: { type: 'integer', example: 1 },
            product: { type: 'object', additionalProperties: true },
            organization: { $ref: '#/components/schemas/Organization' },
            operator: { $ref: '#/components/schemas/User' },
            applicationScore: { $ref: '#/components/schemas/ApplicationScore' },
          },
        },
        ApplicationScore: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            applicationId: { type: 'integer', example: 1 },
            score: { type: 'number', example: 0.0546 },
            status: { type: 'string', example: 'WAITONGOPERATOR' },
            scoringDate: { type: 'string', format: 'date-time' },
            mlScore: {
              type: 'object',
              properties: {
                pd: { type: 'number', example: 0.0546 },
                score: { type: 'number', example: 64 },
                risk_class: { type: 'string', example: 'C' },
                rate_premium_pp: { type: 'number', example: 1 },
                model_version: { type: 'string', example: 'logreg-0.1' },
                updated_at: { type: 'string', format: 'date-time' },
                factors: { type: 'array', items: { type: 'object', additionalProperties: true } },
              },
            },
          },
        },
        OperatorSolution: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['APPROVED', 'REJECTED', 'SPECIALPRODUCTOFFERED'] },
            comment: { type: 'string' },
            product: { type: 'object', additionalProperties: true },
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