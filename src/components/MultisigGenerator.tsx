import { useState } from 'react';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { MultiSigPublicKey } from '@mysten/sui/multisig';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1';
import { ZkLoginPublicIdentifier } from '@mysten/sui/zklogin';
import { fromBase64, toBase64 } from '@mysten/sui/utils';

function normalizeToPureEd25519(base64Str: string): Ed25519PublicKey {
  const bytes = fromBase64(base64Str);
  const pureBytes = (bytes.length === 33 && bytes[0] === 0) ? bytes.slice(1) : bytes;
  if (pureBytes.length !== 32) {
    throw new Error(`公钥长度错误: 期望 32 字节，实际得到 ${pureBytes.length} 字节`);
  }
  return new Ed25519PublicKey(pureBytes);
}

// 终极防弹版钱包解析器
function getWalletPublicKey(account: any) {
  const originalBytes = new Uint8Array(account.publicKey);
  const targetAddress = account.address;

  // 核心修复：把“带标志位(原始)”和“切除标志位(slice(1))”两种情况列为候选名单
  const candidates = [
    originalBytes,         
    originalBytes.slice(1) 
  ];

  // 遍历所有可能性，让底层的哈希算法去验证哪个是对的
  for (const bytes of candidates) {
    try {
      const edKey = new Ed25519PublicKey(bytes);
      if (edKey.toSuiAddress() === targetAddress) return edKey;
    } catch {}

    try {
      const zkKey = new ZkLoginPublicIdentifier(bytes);
      if (zkKey.toSuiAddress() === targetAddress) return zkKey;
    } catch {}

    try {
      const secpKey = new Secp256k1PublicKey(bytes);
      if (secpKey.toSuiAddress() === targetAddress) return secpKey;
    } catch {}

    try {
      const r1Key = new Secp256r1PublicKey(bytes);
      if (r1Key.toSuiAddress() === targetAddress) return r1Key;
    } catch {}
  }

  throw new Error(`无法匹配当前钱包地址。底层字节长度为: ${originalBytes.length}`);
}

export function MultisigGenerator() {
  const account = useCurrentAccount();
  const [pk1, setPk1] = useState('AHOz5DjgjI5LO3suU0btfcz9pNy7Ciu1EGNJbLbhL//e');
  const [pk2, setPk2] = useState('AMryn+9Wh0qF7Nsn8r58KJYH9z6h/JCzWfEpwrWfAENb');
  
  const [result, setResult] = useState<{
    address: string;
    keys: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const generateMultisig = () => {
    setErrorMsg('');
    setResult(null);

    if (!account) {
      setErrorMsg("请先连接 Sui 官方钱包");
      return;
    }

    try {
      const pubKey1 = normalizeToPureEd25519(pk1);
      const pubKey2 = normalizeToPureEd25519(pk2);
      
      // 这里的 61 字节 zkLogin 公钥会被完美解析
      const walletPubKey = getWalletPublicKey(account);

      const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
        threshold: 2,
        publicKeys: [
          { publicKey: walletPubKey, weight: 1 },
          { publicKey: pubKey1, weight: 1 },
          { publicKey: pubKey2, weight: 1 },
        ],
      });

      setResult({
        address: multiSigPublicKey.toSuiAddress(),
        keys: [
          toBase64(walletPubKey.toRawBytes()),
          toBase64(pubKey1.toRawBytes()),
          toBase64(pubKey2.toRawBytes()),
        ]
      });

    } catch (error: any) {
      setErrorMsg("生成失败: " + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px' }}>
      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h3>1. 账户 1 (当前钱包)</h3>
        <ConnectButton />
        {account && <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>地址: {account.address}</p>}
      </div>

      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3>2. 账户 2 & 3 (外部公钥)</h3>
        <input 
          placeholder="输入公钥 1 (Base64)" 
          value={pk1} onChange={(e) => setPk1(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
        <input 
          placeholder="输入公钥 2 (Base64)" 
          value={pk2} onChange={(e) => setPk2(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <button onClick={generateMultisig} style={{ padding: '12px', background: '#0071ef', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        生成 2-of-3 多签账户
      </button>

      {errorMsg && <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</p>}

      {result && (
        <div style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '8px', border: '1px solid #bae7ff' }}>
          <h2 style={{ color: '#0050b3', marginTop: 0 }}>🎉 多签账户已生成</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>多签地址 (Multisig Address):</strong>
            <p style={{ wordBreak: 'break-all', background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>{result.address}</p>
          </div>

          <div>
            <strong>参与公钥 (Base64):</strong>
            <ul style={{ fontSize: '13px', paddingLeft: '20px' }}>
              {result.keys.map((key, i) => (
                <li key={i} style={{ wordBreak: 'break-all', marginBottom: '8px' }}>
                  <strong>账户 {i + 1} {i === 0 ? "(钱包端)" : ""}:</strong> <br/>{key}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
