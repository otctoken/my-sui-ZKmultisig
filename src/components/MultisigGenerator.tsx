import { useState } from 'react';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { MultiSigPublicKey } from '@mysten/sui/multisig';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1';
import { ZkLoginPublicIdentifier } from '@mysten/sui/zklogin';

// 动态解析钱包公钥的“神机妙算”助手函数
function getWalletPublicKey(account: any) {
  // 1. 解决 ReadonlyUint8Array 的类型报错，强制转换为普通 Uint8Array
  const pubKeyBytes = new Uint8Array(account.publicKey);
  const targetAddress = account.address;

  // 2. 挨个尝试不同的加密方案，能对上地址的就是正确的！
  try {
    const edKey = new Ed25519PublicKey(pubKeyBytes);
    if (edKey.toSuiAddress() === targetAddress) return edKey;
  } catch {}

  try {
    const zkKey = new ZkLoginPublicIdentifier(pubKeyBytes);
    if (zkKey.toSuiAddress() === targetAddress) return zkKey;
  } catch {}

  try {
    const secpKey = new Secp256k1PublicKey(pubKeyBytes);
    if (secpKey.toSuiAddress() === targetAddress) return secpKey;
  } catch {}

  try {
    const secp256r1Key = new Secp256r1PublicKey(pubKeyBytes);
    if (secp256r1Key.toSuiAddress() === targetAddress) return secp256r1Key;
  } catch {}

  throw new Error("无法识别当前钱包的公钥类型");
}

export function MultisigGenerator() {
  const account = useCurrentAccount();
  
  const [pk1, setPk1] = useState('');
  const [pk2, setPk2] = useState('');
  const [multisigAddress, setMultisigAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const generateMultisig = () => {
    setErrorMsg('');
    setMultisigAddress('');

    if (!account) {
      setErrorMsg("请先连接 Sui 钱包");
      return;
    }
    if (!pk1 || !pk2) {
      setErrorMsg("请填写完整的公钥 1 和公钥 2");
      return;
    }

    try {
      const pubKey1 = new Ed25519PublicKey(pk1);
      const pubKey2 = new Ed25519PublicKey(pk2);

      // 使用我们写好的助手函数，完美拿到钱包的 PublicKey 对象
      const walletPubKey = getWalletPublicKey(account);

      const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
        threshold: 2,
        publicKeys: [
          { publicKey: walletPubKey, weight: 1 },
          { publicKey: pubKey1, weight: 1 },
          { publicKey: pubKey2, weight: 1 },
        ],
      });

      setMultisigAddress(multiSigPublicKey.toSuiAddress());

    } catch (error: any) {
      console.error(error);
      setErrorMsg("生成失败，请检查输入的公钥格式是否正确。错误信息: " + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>1. 当前钱包账户 (权重: 1)</h3>
        <ConnectButton />
        {account && <p style={{ fontSize: '12px', color: 'gray' }}>当前连接: {account.address}</p>}
      </div>

      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3>2. 离线/传统私钥账户 (权重各: 1)</h3>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>公钥 1 (Base64格式)</label>
          <input 
            type="text" value={pk1} onChange={(e) => setPk1(e.target.value)} 
            placeholder="例如: d2FzaHViZXI..." 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>公钥 2 (Base64格式)</label>
          <input 
            type="text" value={pk2} onChange={(e) => setPk2(e.target.value)} 
            placeholder="例如: eHl6MTIzNDU..." 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <button 
        onClick={generateMultisig} disabled={!account}
        style={{ padding: '12px', fontSize: '16px', cursor: account ? 'pointer' : 'not-allowed', backgroundColor: account ? '#0071ED' : '#ccc', color: 'white', border: 'none', borderRadius: '8px' }}
      >
        生成多签地址
      </button>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      {multisigAddress && (
        <div style={{ padding: '15px', backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0050b3' }}>✅ 生成成功！你的 2-of-3 多签地址：</h4>
          <code style={{ wordBreak: 'break-all', fontSize: '14px' }}>{multisigAddress}</code>
        </div>
      )}
    </div>
  );
}
