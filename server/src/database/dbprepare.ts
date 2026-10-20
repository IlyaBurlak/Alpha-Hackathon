
import { Umzug, SequelizeStorage } from 'umzug';

import { sequelize } from './dbconfig';

export class BdCongigClass {
    static prepareModels() {
          const models = {  };

          Object.values(models).forEach((model: any) => {
            if (typeof model.associate === 'function') {
              model.associate(models);
            }
          });
    }

    static async prepareStartData() {
    try {
      const umzug = new Umzug({
        migrations: {
          glob: ['migrations/*.ts', { cwd: __dirname }],
        },
        context: sequelize,
        storage: new SequelizeStorage({ sequelize }),
        logger: console,
      });

      await umzug.up();
      console.log('Миграции применены');
    } catch (error) {
      console.error('Ошибка миграций:', error);
    }
  }
}
