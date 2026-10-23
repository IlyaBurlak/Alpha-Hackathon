import { test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { UserService } from '../../src/api/user/user.service';
import { UserEntity } from '../../src/api/user/entity/user.entity';
import type { IUserRepository } from '../../src/api/user/user.repository.interface';

const PASSWORD = 'alfaTest!';
const PASSWORD_HASH = bcrypt.hashSync(PASSWORD, 12);

function buildUser(): UserEntity {
  return new UserEntity({ id: 1, login: 'alfaTest', fullName: 'Тестов Тест', password: PASSWORD_HASH });
}

function buildService(user: UserEntity) {
  const fakeUserRepo: IUserRepository = {
    getCounter: async () => 0,
    getUserByLogin: async () => user,
    getUserById: async () => user,
    getOperatorByLogin: async () => user,
  };
  return new UserService(fakeUserRepo);
}

test('login resolves with the user when the password matches its hash', async () => {
  const service = buildService(buildUser());

  const result = await service.login('alfaTest', PASSWORD);

  assert.equal(result.login, 'alfaTest');
});

test('login rejects when the password does not match the stored hash', async () => {
  const service = buildService(buildUser());

  await assert.rejects(() => service.login('alfaTest', 'wrong-password'));
});

test('loginOperator resolves with the operator when the password matches', async () => {
  const service = buildService(buildUser());

  const result = await service.loginOperator('alfaOperator1', PASSWORD);

  assert.equal(result.login, 'alfaTest');
});

test('loginOperator rejects when the password does not match', async () => {
  const service = buildService(buildUser());

  await assert.rejects(() => service.loginOperator('alfaOperator1', 'wrong-password'));
});
