
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Support API',
      version: '1.0.0',
      description: 'API для поддержки',
    },
    tags: [
      { name: 'Bank', description: 'Банковские продукты' },
      { name: 'Credit bureau', description: 'Кредитная история' },
      { name: 'Unified register', description: 'Данные единого реестра' },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Service is currently inactive' },
          },
        },
        CreditTime: {
          type: 'object',
          required: ['units', 'value'],
          properties: {
            units: { type: 'string', enum: ['DAY', 'MONTH', 'YEAR'], example: 'MONTH' },
            value: { type: 'integer', example: 6 },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Кредит для бизнеса с залогом' },
            minSum: { type: 'number', example: 10000 },
            maxSum: { type: 'number', example: 100000000 },
            minCreditTime: { $ref: '#/components/schemas/CreditTime' },
            maxCreditTime: { $ref: '#/components/schemas/CreditTime' },
            ooAvailable: { type: 'boolean', example: true },
            ieAvailable: { type: 'boolean', example: true },
            minCollateral: { type: 'number', example: 20000 },
            persentage: { type: 'number', example: 10 },
            payments: { type: 'string', example: 'ежемесячно, равными долями' },
          },
        },
        CreditHistoryRecord: {
          type: 'object',
          properties: {
            provisionDate: { type: 'string', format: 'date' },
            sum: { type: 'number', example: 50000 },
            status: { type: 'string', example: 'PAID' },
            paymentDeadline: { type: 'string', format: 'date' },
          },
        },
        CreditHistory: {
          type: 'object',
          properties: {
            inn: { type: 'string', example: '5001234569' },
            fullName: { type: 'string', example: 'ООО "Кот не знает"' },
            creditHistory: {
              type: 'array',
              items: { $ref: '#/components/schemas/CreditHistoryRecord' },
            },
            bankrupt: { type: 'boolean', example: false },
            casesDelayedPayment: { type: 'integer', example: 0 },
          },
        },
        RegisterInfo: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'ООО' },
            inn: { type: 'string', example: '5001234569' },
            ogrn: { type: 'string', example: '1234567890124' },
            okved: { type: 'string', example: '58.19 Виды издательской деятельности прочие' },
            fullName: { type: 'string', example: 'ООО "Кот не знает"' },
            head: { type: 'string', example: 'Василенко Анжелика' },
            kpp: { type: 'string', example: '500101001' },
            address: { type: 'string' },
            account: { type: 'string' },
            isActive: { type: 'boolean', example: true },
            registrationDate: { type: 'string', format: 'date' },
            bankClientSince: { type: 'string', format: 'date' },
            liquidationDate: { type: 'string', format: 'date', nullable: true },
            authCapital: { type: 'number' },
            employeesCount: { type: 'integer' },
            annualIncome: { type: 'number' },
            annualExpenses: { type: 'number' },
            lastYearBalances: { type: 'array', items: { type: 'number' } },
          },
        },
        ActiveState: {
          type: 'object',
          required: ['isActive'],
          properties: {
            isActive: { type: 'boolean', example: true },
          },
        },
        Message: {
          type: 'object',
          properties: { message: { type: 'string', example: 'ok' } },
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