/**
 * Wallet List Component
 */

import { WalletButton } from './WalletButton';
import type { WalletListProps } from '../types';

/**
 * List of wallet options for selection
 * 
 * @example
 * ```tsx
 * <WalletList
 *   wallets={walletConfigs}
 *   onSelect={(walletId) => handleConnect(walletId)}
 *   selectedWallet={currentWallet}
 * />
 * ```
 */
export function WalletList({
  wallets,
  onSelect,
  selectedWallet = null,
  disabledWallets = [],
  className = '',
  style,
}: WalletListProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        ...style,
      }}
    >
      {wallets.map((wallet) => (
        <WalletButton
          key={wallet.id}
          wallet={wallet}
          onClick={() => onSelect(wallet.id)}
          isInstalled={true} // This should be determined by useWalletDetection
          disabled={disabledWallets.includes(wallet.id)}
          selected={selectedWallet === wallet.id}
        />
      ))}
    </div>
  );
}
