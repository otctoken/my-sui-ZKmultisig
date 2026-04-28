import { useState } from 'react';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { MultiSigPublicKey } from '@mysten/sui/multisig';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { publicKeyFromRawBytes } from '@mysten/sui/verify';

export function MultisigGenerator() {
  const account = useCurrentAccount();
  
  // 状态管理：存储用户输入的两个 Base64 公钥
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
      // 1. 将用户输入的 Base64 字符串解析为 Ed25519 公钥对象
      const pubKey1 = new Ed25519PublicKey(pk1);
      const pubKey2 = new Ed25519PublicKey(pk2);

      // 2. 获取当前连接钱包的公钥对象 (自动处理 zkLogin 或普通账户)
      const walletPubKey = publicKeyFromRawBytes(
        account.signatureScheme,
        account.publicKey
      );

      // 3. 构建 2-of-3 多签体系
      const multiSigPublicKey = MultiSigPublicKey.fromPublicKeys({
        threshold: 2,
        publicKeys: [
          { publicKey: walletPubKey, weight: 1 },
          { publicKey: pubKey1, weight: 1 },
          { publicKey: pubKey2, weight: 1 },
        ],
      });

      // 4. 生成最终地址
      const address = multiSigPublicKey.toSuiAddress();
      setMultisigAddress(address);

    } catch (error: any) {
      console.error(error);
      setErrorMsg("生成失败，请检查输入的公钥格式是否为正确的 Base64 字符串。错误信息: " + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
      
      {/* 钱包连接组件 */}
      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>1. 当前钱包账户 (权重: 1)</h3>
        <ConnectButton />
        {account && <p style={{ fontSize: '12px', color: 'gray' }}>当前连接: {account.address}</p>}
      </div>

      {/* 公钥输入框 */}
      <div style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3>2. 离线/传统私钥账户 (权重各: 1)</h3>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>公钥 1 (Base64格式)</label>
          <input 
            type="text" 
            value={pk1} 
            onChange={(e) => setPk1(e.target.value)} 
            placeholder="例如: d2FzaHViZXI..." 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px' }}>公钥 2 (Base64格式)</label>
          <input 
            type="text" 
            value={pk2} 
            onChange={(e) => setPk2(e.target.value)} 
            placeholder="例如: eHl6MTIzNDU..." 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* 动作按钮与结果展示 */}
      <button 
        onClick={generateMultisig} 
        disabled={!account}
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
