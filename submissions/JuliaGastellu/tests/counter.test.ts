import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { AccountRole, generateKeyPairSigner, type Address, type TransactionSigner } from '@solana/kit';
import {
  fundWallet,
  getCounterAddress,
  getInitializeInstruction,
  getIncrementInstruction,
  readCounter,
  rpc,
  sendRejectedInstructions,
  sendInstructions,
  simulateInstructions,
} from '../app/client.ts';

let alice: TransactionSigner;
let bob: TransactionSigner;
let aliceCounter: Address;
let bobCounter: Address;
let aliceBump: number;

before(async () => {
  alice = await generateKeyPairSigner();
  bob = await generateKeyPairSigner();
  await fundWallet(alice);
  await fundWallet(bob);
  [aliceCounter, aliceBump] = await getCounterAddress(alice.address);
  [bobCounter] = await getCounterAddress(bob.address);
});

test('Creo una PDA con autoridad, bump y contador en cero', async () => {
  await sendInstructions(alice, [getInitializeInstruction(alice, aliceCounter)]);
  assert.deepEqual(await readCounter(aliceCounter), {
    authority: alice.address, count: 0n, bump: aliceBump, dataLength: 49,
  });
});

test('Incremento el estado de mi contador hasta dos', async () => {
  await sendInstructions(alice, [getIncrementInstruction(alice, aliceCounter)]);
  await sendInstructions(alice, [getIncrementInstruction(alice, aliceCounter)]);
  assert.equal((await readCounter(aliceCounter)).count, 2n);
});

test('Mantengo una PDA independiente para cada wallet', async () => {
  assert.notEqual(aliceCounter, bobCounter);
  await sendInstructions(bob, [getInitializeInstruction(bob, bobCounter)]);
  assert.equal((await readCounter(bobCounter)).count, 0n);
  assert.equal((await readCounter(aliceCounter)).count, 2n);
});

test('Rechazo otra autoridad sin cambiar el contador', async () => {
  const result = await simulateInstructions(bob, [getIncrementInstruction(bob, aliceCounter)]);
  assert.deepEqual(result.err, { InstructionError: [0n, { Custom: 6000n }] });
  assert.equal((await readCounter(aliceCounter)).count, 2n);
});

test('Exijo la firma de la autoridad aunque otra wallet pague', async () => {
  // Quito el signer de Alice para comprobar la validación del programa.
  const instruction = getIncrementInstruction(alice, aliceCounter);
  const accounts = [
    { address: alice.address, role: AccountRole.READONLY },
    { address: aliceCounter, role: AccountRole.WRITABLE },
  ];
  const result = await simulateInstructions(bob, [{ ...instruction, accounts }]);
  assert.deepEqual(result.err, { InstructionError: [0n, { Custom: 3010n }] });
  assert.equal((await readCounter(aliceCounter)).count, 2n);
});

test('Impido reinicializar una PDA que ya tiene estado', async () => {
  const result = await simulateInstructions(alice, [getInitializeInstruction(alice, aliceCounter)]);
  assert.notEqual(result.err, null);
  assert.equal((await readCounter(aliceCounter)).count, 2n);
});

test('Revierto el primer incremento si falla la segunda instrucción', async () => {
  const { value: before } = await rpc.getBalance(alice.address, { commitment: 'confirmed' }).send();
  const result = await sendRejectedInstructions(alice, [
    getIncrementInstruction(alice, aliceCounter),
    getIncrementInstruction(alice, bobCounter),
  ]);
  assert.deepEqual(result.error, { InstructionError: [1n, { Custom: 6000n }] });
  assert.equal((await readCounter(aliceCounter)).count, 2n);
  assert.equal((await readCounter(bobCounter)).count, 0n);
  const { value: after } = await rpc.getBalance(alice.address, { commitment: 'confirmed' }).send();
  assert.equal(before - after, result.fee);
});
