import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApplicationScoreEntity, AnalysisStatus } from '../../src/api/applications/entity/application.score.entity';

test('maps base fields without touching nested info', () => {
  const entity = new ApplicationScoreEntity({
    id: 1,
    applicationId: 10,
    scoringDate: null,
    score: 0,
    status: AnalysisStatus.PENDINGCRREDITHISTORY,
  });

  assert.equal(entity.id, 1);
  assert.equal(entity.applicationId, 10);
  assert.equal(entity.status, AnalysisStatus.PENDINGCRREDITHISTORY);
  assert.equal(entity.history, undefined);
  assert.equal(entity.registerInfo, undefined);
  assert.equal(entity.mlScore, undefined);
});

test('maps history, registerInfo and mlScore when info is present', () => {
  const entity = new ApplicationScoreEntity({
    id: 2,
    applicationId: 10,
    status: AnalysisStatus.COMPLETED,
    info: {
      history: { creditHistory: { sum: 100 }, bankrupt: false, casesDelayedPayment: 0 },
      registerInfo: { isActive: true, authCapital: 500000 },
      mlScore: { model_version: 'stub-0.0', factors: ['revenue_cv'] },
    },
  });

  assert.equal(entity.history?.bankrupt, false);
  assert.equal(entity.registerInfo?.authCapital, 500000);
  assert.equal(entity.mlScore?.model_version, 'stub-0.0');
  assert.deepEqual(entity.mlScore?.factors, ['revenue_cv']);
});
