export enum AnalysisStatus {
    PENDINGCRREDITHISTORY = 1,
    PENDINGREGISTER = 2,
    WAITNGSCORING = 3,
    WAITONGOPERATOR = 4,
    COMPLETED = 5,
}

export class CreditHistory {
    provisionDate!: Date;
    sum!: number;
    status!: string;
    paymentDeadline!: Date;
}

export class CreditHistoryInfo {
    public creditHistory!: CreditHistory;
    public bankrupt!: boolean;
    public casesDelayedPayment!: number;
}

export class RegisterInfo {
    public isActive!: boolean;
    public registrationDate!: Date;
    public authCapital!: number;
    public employeesCount!: number;
    public annualIncome!: number;
    public annualExpenses!: number;
    public lastYearBalances!: number[];
    public ogrn!: string;
    public okved!: string
    public head!: string;
    public kpp!: string;
    public bankClientSince!: Date;
    public address!: string;
    public account!: string;
}

export class MlScoreEntity {
    pd?: number;
    model_version!: string;
    factors!: any[];
}

export class ApplicationScoreEntity {
    public id!: number;
    public applicationId!: number;
    public scoringDate!: Date;
    public creatingDate!: Date;
    public score!: number;
    public status!: AnalysisStatus;
    public history?: CreditHistoryInfo;
    public registerInfo?: RegisterInfo;
    public mlScore?: MlScoreEntity;
  

    constructor(model: any) {
        this.id = model.id;
        this.applicationId = model.applicationId;
        this.scoringDate = model.scoringDate;
        this.score = model.score;
        this.status = model.status;
        
        if (model.info) {
            this.history = {
                creditHistory: model.info.history?.creditHistory,
                bankrupt: model.info.history?.bankrupt,
                casesDelayedPayment: model.info.history?.casesDelayedPayment
            }
            this.registerInfo = {
                isActive: model.info.registerInfo?.isActive,
                registrationDate: model.info.registerInfo?.registrationDate,
                authCapital: model.info.registerInfo?.authCapital,
                employeesCount: model.info.registerInfo?.employeesCount,
                annualIncome: model.info.registerInfo?.annualIncome,
                annualExpenses: model.info.registerInfo?.annualExpenses,
                lastYearBalances: model.info.registerInfo?.lastYearBalances,
                ogrn: model.info.registerInfo?.ogrn,
                okved: model.info.registerInfo?.okved,
                head: model.info.registerInfo?.head,
                kpp: model.info.registerInfo?.kpp,
                bankClientSince: model.info.registerInfo?.bankClientSince,
                address: model.info.registerInfo?.address,
                account: model.info.registerInfo?.account

            }
            this.mlScore = {
                model_version: model.info.mlScore?.model_version,
                factors: model.info.mlScore?.factors
            }
        }
    }

}