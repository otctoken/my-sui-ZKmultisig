import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MultisigGenerator } from './components/MultisigGenerator';

// 直接使用字符串 URL 替换 getFullnodeUrl，完美避开 TS 类型报错
const { networkConfig } = createNetworkConfig({
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443' },
  testnet: { url: 'https://fullnode.testnet.sui.io:443' },
});

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider autoConnect>
          <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <h1>🛡️ 2-of-3 多签地址生成器</h1>
            <p>连接你的钱包 (支持 zkLogin)，并输入另外两个冷钱包的公钥来生成多签地址。</p>
            <MultisigGenerator />
          </div>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
