const { HDNodeWallet, Mnemonic } = require('ethers');
const phrase = 'test test test test test test test test test test test junk';
for (let i = 0; i < 20; i++) {
  const path = `m/44'/60'/0'/0/${i}`;
  const wallet = HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(phrase), path);
  console.log(`${i}\t${wallet.address}\t${wallet.privateKey}`);
}
