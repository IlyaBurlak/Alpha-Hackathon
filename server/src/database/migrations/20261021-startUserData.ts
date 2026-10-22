import type { MigrationParams } from 'umzug';
import type { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';

type Ctx = MigrationParams<Sequelize>;
const saltRounds = 12

export const up = async ({ context: sequelize }: Ctx): Promise<void> => {
  await sequelize.getQueryInterface().bulkInsert('users', [
    {  id: 1, login: 'alfaTest', password: bcrypt.hashSync('alfaTest!', saltRounds), fullName: "Тестов Тест" },
    {  id: 2, login: 'alfaAngelika', password: bcrypt.hashSync('alfaAngelika!', saltRounds), fullName: "Василенко Анжелика" },
    {  id: 3, login: 'alfaIlia', password: bcrypt.hashSync('alfaIlia!', saltRounds), fullName: "Бурлак Илья" },
    {  id: 4,  login: 'alfaIvan', password: bcrypt.hashSync('alfaIvan!', saltRounds), fullName: "Сырный Иван" },
    {  id: 5,  login: 'alfaSergey', password: bcrypt.hashSync('alfaSergey!', saltRounds), fullName: "Динозавриков Сергей" },
    {  id: 6,  login: 'alfaAlex', password: bcrypt.hashSync('alfaAlex!', saltRounds), fullName: "Котов Александр" },
  ]);
  await sequelize.getQueryInterface().bulkInsert('operators', [
    {  id: 1, login: 'alfaOperator1', password: 'alfaOperator1!', fullName: "Кошмариков Антон" },
    {  id: 2, login: 'alfaOperator2', password: 'alfaOperator2!', fullName: "Супов Владислав" },
  ]);
  await sequelize.getQueryInterface().bulkInsert('organizations', [
    {  id: 1, inn: '7701234568', fullName: 'ООО "Ромашка"', type: 1 },
    {  id: 2, inn: '5001234569', fullName: 'ООО "Кот не знает"', type: 1 },
    {  id: 3, inn: '7801234562', fullName: 'ООО "Таинственный сад"', type: 1 },
    {  id: 4, inn: '6601234564', fullName: 'ООО "АмёбаПродакшн"', type: 1 },
    {  id: 5, inn: '2301234560', fullName: 'ИП Сырный Иван', type: 2 },
    {  id: 6, inn: '5401234563', fullName: 'ИП Динозавриков Сергей"', type: 2 },
  ]);
   await sequelize.getQueryInterface().bulkInsert('user_to_organizations', [
    {  userId: 1, organizationId: 1 },
    {  userId: 5, organizationId: 3 },
    {  userId: 5, organizationId: 6 },
    {  userId: 4, organizationId: 5 },
    {  userId: 2, organizationId: 2 },
  ]);

};
