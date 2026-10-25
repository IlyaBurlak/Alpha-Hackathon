import type { MigrationParams } from 'umzug';
import type { Sequelize } from 'sequelize';

type Ctx = MigrationParams<Sequelize>;


export const up = async ({ context: sequelize }: Ctx): Promise<void> => {
  await sequelize.getQueryInterface().bulkInsert('applications', [
    { id: 1, 
      productId: 1, 
      productConditions: `{"name":"Кредит для бизнеса с залогом","persentage":10,"payments":"ежемесячно, равными долями, с первым платежом через 6 месяцев"}`,
      userId: 2,
      organizationId: 2,
      sum: 10000 ,
      creditTimeUnits:3 ,
      creditValue: 1,
      status: 8,
      createdAt: "2026-10-25 13:58:46.472 +00:00" ,
      loanIssuanceDate: "2026-10-25 13:58:46.472 +00:00" ,
      solutionComment: "Одобрено",
      operatorId: 1
    },
    { id: 2, 
      productId: 1, 
      productConditions: `{"name":"Кредит для бизнеса без залога","persentage":5,"payments":"ежемесячно, равными долями, с первым платежом через 6 месяцев"}`,
      userId: 2,
      organizationId: 2,
      sum: 15000 ,
      creditTimeUnits:3 ,
      creditValue: 1,
      status: 8,
      createdAt: "2026-03-25 13:58:46.472 +00:00" ,
      loanIssuanceDate: "2026-03-25 13:58:46.472 +00:00" ,
      solutionComment: "Одобрено, успехов в бизнесе!",
      operatorId: 1
    }
  ]);
  await sequelize.getQueryInterface().bulkInsert('applications_scoring', [
    { id: 1, 
      applicationId: 1, 
      scoringDate: "2026-10-25 13:59:02.591 +00:00",
      creatingDate: "2026-10-25 13:59:02.591 +00:00",
      score: 0.1,
      status: 5,
      info: `{"history":{"inn":"5001234569","fullName":"ООО \"Кот не знает\"","creditHistory":[{"provisionDate":"2022-05-10","sum":50000,"status":"PAID","paymentDeadline":"2023-05-10"}],"bankrupt":false,"casesDelayedPayment":0},"registerInfo":{"type":"ООО","inn":"5001234569","ogrn":"1234567890124","okved":"58.19 Виды издательской деятельности прочие","head":"Василенко Анжелика","fullName":"ООО \"Кот не знает\"","address":"г. Санкт-Петербург, ул. Ленина, д. 2","kpp":"500101001","account":"4015****23","isActive":true,"registrationDate":"2021-01-15","bankClientSince":"2023-01-15","liquidationDate":null,"authCapital":20000,"employeesCount":24,"annualIncome":400000,"lastYearBalances":[100000,100040,100023,140022,200342,123333,4632222,200001,322221,104000,100500,100000,100023,140022,200342,123333],"annualExpenses":200000},"mlScore":{"factors":["revenue_cv","profit_cv","assets_cv","liabilities_cv","equity_cv"],"model_version":"stub-0.0"}}`
    }, 
     { id: 2, 
      applicationId: 2, 
      scoringDate: "2026-03-25 13:59:02.591 +00:00",
      creatingDate: "2026-03-25 13:59:02.591 +00:00",
      score: 0.1,
      status: 5,
      info: `{"history":{"inn":"5001234569","fullName":"ООО \"Кот не знает\"","creditHistory":[{"provisionDate":"2022-05-10","sum":50000,"status":"PAID","paymentDeadline":"2023-05-10"}],"bankrupt":false,"casesDelayedPayment":0},"registerInfo":{"type":"ООО","inn":"5001234569","ogrn":"1234567890124","okved":"58.19 Виды издательской деятельности прочие","head":"Василенко Анжелика","fullName":"ООО \"Кот не знает\"","address":"г. Санкт-Петербург, ул. Ленина, д. 2","kpp":"500101001","account":"4015****23","isActive":true,"registrationDate":"2021-01-15","bankClientSince":"2023-01-15","liquidationDate":null,"authCapital":20000,"employeesCount":24,"annualIncome":40000０,"lastYearBalances":[1０００００,１０００４０,１０００２３,１４００２２,２００３４２,１２３３３３,４６３２２２２,２００００１,３２２２２１,１０４０００,１００５００,１００００₀,１０₀₀₂₃,１４₀₀₂₂,２₀₀₃₄₂,１₂₃₃₃₃],"annualExpenses":２₀₀₀₀₀},"mlScore":{"factors":["revenue_cv","profit_cv","assets_cv","liabilities_cv","equity_cv"],"model_version":"stub-₀.₀"}}`
    }
  ]);

};
