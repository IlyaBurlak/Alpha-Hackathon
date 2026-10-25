import { test, mock } from 'node:test';
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
  const fakeUserRepo = {
    getCounter: async () => 0,
    getUserByLogin: mock.fn(async () => user),
    getUserById: async () => user,
    getOperatorByLogin: mock.fn(async () => user),
  } as unknown as IUserRepository;
  return { service: new UserService(fakeUserRepo), fakeUserRepo };
}

test('login resolves with the user when the password matches its hash', async () => {
  const { service, fakeUserRepo } = buildService(buildUser());

  const result = await service.login('alfaTest', PASSWORD);

  assert.equal(result.login, 'alfaTest');
  const repoMock = fakeUserRepo.getUserByLogin as unknown as ReturnType<typeof mock.fn>;
  assert.deepEqual(repoMock.mock.calls[0].arguments, ['alfaTest']);
});

test('login rejects when the password does not match the stored hash', async () => {
  const { service } = buildService(buildUser());

  await assert.rejects(() => service.login('alfaTest', 'wrong-password'));
});

test('loginOperator resolves with the operator when the password matches', async () => {
  const { service, fakeUserRepo } = buildService(buildUser());

  const result = await service.loginOperator('alfaOperator1', PASSWORD);

  assert.equal(result.login, 'alfaTest');
  const repoMock = fakeUserRepo.getOperatorByLogin as unknown as ReturnType<typeof mock.fn>;
  assert.deepEqual(repoMock.mock.calls[0].arguments, ['alfaOperator1']);
});

test('loginOperator rejects when the password does not match', async () => {
  const { service } = buildService(buildUser());

  await assert.rejects(() => service.loginOperator('alfaOperator1', 'wrong-password'));
});

test('getUserByLogin delegates to the repository', async () => {
  const user = buildUser();
  const { service, fakeUserRepo } = buildService(user);

  assert.equal(await service.getUserByLogin('alfaTest'), user);
  const repoMock = fakeUserRepo.getUserByLogin as unknown as ReturnType<typeof mock.fn>;
  assert.deepEqual(repoMock.mock.calls[0].arguments, ['alfaTest']);
});

test('getOperatorByLogin delegates to the repository', async () => {
  const user = buildUser();
  const { service, fakeUserRepo } = buildService(user);

  assert.equal(await service.getOperatorByLogin('alfaOperator1'), user);
  const repoMock = fakeUserRepo.getOperatorByLogin as unknown as ReturnType<typeof mock.fn>;
  assert.deepEqual(repoMock.mock.calls[0].arguments, ['alfaOperator1']);
});
