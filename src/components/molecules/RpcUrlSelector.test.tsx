import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RpcUrlSelector } from './RpcUrlSelector';
import type { RPCUrl } from '@/features/configuration/schemas';

const makeRpcUrl = (overrides: Partial<RPCUrl>): RPCUrl => ({
  id: 'rpc-1',
  name: 'My RPC',
  rpcUrl: 'https://eth-sepolia.example.com',
  type: 'ExecutionLayer',
  network: 'Testnet',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('RpcUrlSelector', () => {
  it('renders with no saved URLs and shows manual input', () => {
    render(
      <RpcUrlSelector
        id="l1RpcUrl"
        label="L1 RPC URL"
        placeholder="https://..."
        value=""
        onChange={vi.fn()}
        rpcUrls={[]}
        urlType="ExecutionLayer"
        network="Testnet"
      />
    );
    expect(screen.getByLabelText(/L1 RPC URL/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://...')).toBeInTheDocument();
  });

  it('shows dropdown with matching saved RPC URLs on focus', () => {
    const rpcUrls = [
      makeRpcUrl({ id: 'rpc-1', name: 'Alchemy Sepolia', rpcUrl: 'https://eth-sepolia.alchemy.com' }),
      makeRpcUrl({ id: 'rpc-2', name: 'Infura Sepolia', rpcUrl: 'https://sepolia.infura.io' }),
      makeRpcUrl({ id: 'rpc-3', name: 'Mainnet EL', rpcUrl: 'https://eth-mainnet.alchemy.com', network: 'Mainnet' }),
      makeRpcUrl({ id: 'rpc-4', name: 'Beacon Testnet', rpcUrl: 'https://beacon.example.com', type: 'BeaconChain' }),
    ];

    render(
      <RpcUrlSelector
        id="l1RpcUrl"
        label="L1 RPC URL"
        placeholder="https://..."
        value=""
        onChange={vi.fn()}
        rpcUrls={rpcUrls}
        urlType="ExecutionLayer"
        network="Testnet"
      />
    );

    const input = screen.getByLabelText(/L1 RPC URL/);
    fireEvent.focus(input);

    // Only Testnet ExecutionLayer URLs should appear
    expect(screen.getByText('Alchemy Sepolia')).toBeInTheDocument();
    expect(screen.getByText('Infura Sepolia')).toBeInTheDocument();
    // Mainnet and BeaconChain should not appear
    expect(screen.queryByText('Mainnet EL')).not.toBeInTheDocument();
    expect(screen.queryByText('Beacon Testnet')).not.toBeInTheDocument();
  });

  it('calls onChange with the rpcUrl value when a saved URL is selected', () => {
    const onChange = vi.fn();
    const rpcUrls = [
      makeRpcUrl({ id: 'rpc-1', name: 'Alchemy Sepolia', rpcUrl: 'https://eth-sepolia.alchemy.com' }),
    ];

    render(
      <RpcUrlSelector
        id="l1RpcUrl"
        label="L1 RPC URL"
        placeholder="https://..."
        value=""
        onChange={onChange}
        rpcUrls={rpcUrls}
        urlType="ExecutionLayer"
        network="Testnet"
      />
    );

    const input = screen.getByLabelText(/L1 RPC URL/);
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('Alchemy Sepolia'));

    expect(onChange).toHaveBeenCalledWith('https://eth-sepolia.alchemy.com');
  });

  it('calls onChange with typed text when user types manually', () => {
    const onChange = vi.fn();

    render(
      <RpcUrlSelector
        id="l1RpcUrl"
        label="L1 RPC URL"
        placeholder="https://..."
        value=""
        onChange={onChange}
        rpcUrls={[]}
        urlType="ExecutionLayer"
        network="Testnet"
      />
    );

    const input = screen.getByLabelText(/L1 RPC URL/);
    fireEvent.change(input, { target: { value: 'https://custom.rpc.io' } });

    expect(onChange).toHaveBeenCalledWith('https://custom.rpc.io');
  });

  it('shows error message when error prop is provided', () => {
    render(
      <RpcUrlSelector
        id="l1RpcUrl"
        label="L1 RPC URL"
        placeholder="https://..."
        value=""
        onChange={vi.fn()}
        rpcUrls={[]}
        urlType="ExecutionLayer"
        network="Testnet"
        error="L1 RPC URL is required"
      />
    );

    expect(screen.getByText('L1 RPC URL is required')).toBeInTheDocument();
  });
});
