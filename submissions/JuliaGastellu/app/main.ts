import { generateKeyPairSigner } from '@solana/kit';
import {
  fundWallet,
  getCounterAddress,
  getInitializeInstruction,
  getIncrementInstruction,
  readCounter,
  sendInstructions,
} from './client.ts';

// Creo una wallet temporal y pruebo mi programa cargado en el validador local.
const wallet = await generateKeyPairSigner();
await fundWallet(wallet);
const [counter] = await getCounterAddress(wallet.address);
console.log('Mi wallet:', wallet.address);
console.log('Mi PDA:', counter);
console.log('Firma de creación:', await sendInstructions(wallet, [getInitializeInstruction(wallet, counter)]));
console.log('Estado inicial:', await readCounter(counter));
console.log('Firma de incremento:', await sendInstructions(wallet, [getIncrementInstruction(wallet, counter)]));
console.log('Estado final:', await readCounter(counter));
