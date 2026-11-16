import { createHash } from 'node:crypto';
import {
  AccountRole,
  address,
  airdropFactory,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getAddressDecoder,
  getAddressEncoder,
  getBase64EncodedWireTransaction,
  getProgramDerivedAddress,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  assertIsSendableTransaction,
  assertIsTransactionWithBlockhashLifetime,
  type Address,
  type AccountSignerMeta,
  type Instruction,
  type InstructionWithSigners,
  type TransactionSigner,
} from '@solana/kit';

export const PROGRAM_ADDRESS = address('BLjHbkRuZczQxXeuKYi3jLVjJj6QDxE4YVSKGv487v61');
const SYSTEM_PROGRAM_ADDRESS = address('11111111111111111111111111111111');
export const rpc = createSolanaRpc('http://127.0.0.1:8899');
const rpcSubscriptions = createSolanaRpcSubscriptions('ws://127.0.0.1:8900');

export function discriminator(namespace: string, name: string): Buffer {
  // Uso los primeros ocho bytes del hash que identifica una cuenta o instrucción Anchor.
  return createHash('sha256').update(`${namespace}:${name}`).digest().subarray(0, 8);
}

export async function getCounterAddress(authority: Address) {
  return getProgramDerivedAddress({
    programAddress: PROGRAM_ADDRESS,
    seeds: [Buffer.from('counter'), getAddressEncoder().encode(authority)],
  });
}

export function getInitializeInstruction(authority: TransactionSigner, counter: Address): Instruction & InstructionWithSigners {
  const authorityAccount: AccountSignerMeta = {
    address: authority.address, role: AccountRole.WRITABLE_SIGNER, signer: authority,
  };
  return {
    programAddress: PROGRAM_ADDRESS,
    accounts: [
      authorityAccount,
      { address: counter, role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    ],
    data: discriminator('global', 'initialize'),
  };
}

export function getIncrementInstruction(authority: TransactionSigner, counter: Address): Instruction & InstructionWithSigners {
  const authorityAccount: AccountSignerMeta = {
    address: authority.address, role: AccountRole.READONLY_SIGNER, signer: authority,
  };
  return {
    programAddress: PROGRAM_ADDRESS,
    accounts: [
      authorityAccount,
      { address: counter, role: AccountRole.WRITABLE },
    ],
    data: discriminator('global', 'increment'),
  };
}

export async function fundWallet(signer: TransactionSigner) {
  await airdropFactory({ rpc, rpcSubscriptions })({
    recipientAddress: signer.address,
    lamports: lamports(2_000_000_000n),
    commitment: 'confirmed',
  });
}

export async function buildTransaction(payer: TransactionSigner, instructions: Instruction[]) {
  const { value: lifetime } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (message) => setTransactionMessageFeePayerSigner(payer, message),
    (message) => setTransactionMessageLifetimeUsingBlockhash(lifetime, message),
    (message) => appendTransactionMessageInstructions(instructions, message),
  );
  return signTransactionMessageWithSigners(message);
}

export async function sendInstructions(payer: TransactionSigner, instructions: Instruction[]) {
  const transaction = await buildTransaction(payer, instructions);
  assertIsSendableTransaction(transaction);
  assertIsTransactionWithBlockhashLifetime(transaction);
  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(transaction, { commitment: 'confirmed' });
  return getSignatureFromTransaction(transaction);
}

export async function simulateInstructions(payer: TransactionSigner, instructions: Instruction[]) {
  const transaction = await buildTransaction(payer, instructions);
  const { value } = await rpc.simulateTransaction(getBase64EncodedWireTransaction(transaction), {
    encoding: 'base64',
    commitment: 'confirmed',
    sigVerify: true,
  }).send();
  return value;
}

export async function sendRejectedInstructions(payer: TransactionSigner, instructions: Instruction[]) {
  // Envío sin preflight solo en esta prueba: necesito observar un fallo procesado por el nodo.
  const transaction = await buildTransaction(payer, instructions);
  const signature = await rpc.sendTransaction(getBase64EncodedWireTransaction(transaction), {
    encoding: 'base64', skipPreflight: true, maxRetries: 0n,
  }).send();
  for (let attempt = 0; attempt < 30; attempt++) {
    const { value: [status] } = await rpc.getSignatureStatuses([signature]).send();
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
      const confirmed = await rpc.getTransaction(signature, {
        encoding: 'json', commitment: 'confirmed', maxSupportedTransactionVersion: 0,
      }).send();
      if (confirmed?.meta) return { error: status.err, fee: confirmed.meta.fee };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('No pude confirmar el resultado de la prueba de atomicidad.');
}

export async function readCounter(counter: Address) {
  const { value } = await rpc.getAccountInfo(counter, { encoding: 'base64', commitment: 'confirmed' }).send();
  if (value === null) throw new Error('No encuentro la cuenta del contador.');
  if (value.owner !== PROGRAM_ADDRESS || value.executable) {
    throw new Error('La cuenta no corresponde a los datos de mi programa.');
  }

  // Compruebo el tipo y el tamaño antes de interpretar el estado serializado.
  const data = Buffer.from(value.data[0], 'base64');
  if (data.length !== 49 || !data.subarray(0, 8).equals(discriminator('account', 'Counter'))) {
    throw new Error('No reconozco el formato de la cuenta del contador.');
  }
  return {
    authority: getAddressDecoder().decode(data.subarray(8, 40)),
    count: data.readBigUInt64LE(40),
    bump: data[48],
    dataLength: data.length,
  };
}
