import { describe, it, expect } from 'vitest'
import { 
  generateNonce, 
  createSIWEMessage,
  isValidEthereumAddress,
  addressesEqual,
  isValidNonceFormat,
} from './index'

describe('generateNonce', () => {
  it('should generate a nonce string', () => {
    const nonce = generateNonce()
    expect(typeof nonce).toBe('string')
    expect(nonce.length).toBeGreaterThan(0)
  })

  it('should generate unique nonces', () => {
    const nonces = new Set<string>()
    for (let i = 0; i < 100; i++) {
      nonces.add(generateNonce())
    }
    expect(nonces.size).toBe(100)
  })

  it('should generate valid nonce format', () => {
    const nonce = generateNonce()
    expect(isValidNonceFormat(nonce)).toBe(true)
  })
})

describe('createSIWEMessage', () => {
  it('should create a valid SIWE message object', () => {
    const message = createSIWEMessage({
      domain: 'example.com',
      address: '0x1234567890123456789012345678901234567890',
      uri: 'https://example.com',
      chainId: 1,
      nonce: 'abc123def456',
    })
    
    expect(message.domain).toBe('example.com')
    expect(message.address).toBe('0x1234567890123456789012345678901234567890')
    expect(message.raw).toContain('example.com')
    expect(message.raw).toContain('0x1234567890123456789012345678901234567890')
  })
})

describe('isValidEthereumAddress', () => {
  it('should validate correct addresses', () => {
    expect(isValidEthereumAddress('0x1234567890123456789012345678901234567890')).toBe(true)
    expect(isValidEthereumAddress('0xABCDEF1234567890123456789012345678901234')).toBe(true)
  })

  it('should reject invalid addresses', () => {
    expect(isValidEthereumAddress('0x123')).toBe(false)
    expect(isValidEthereumAddress('not-an-address')).toBe(false)
    expect(isValidEthereumAddress('')).toBe(false)
  })
})

describe('addressesEqual', () => {
  it('should compare addresses case-insensitively', () => {
    const addr1 = '0x1234567890123456789012345678901234567890'
    const addr2 = '0x1234567890123456789012345678901234567890'
    const addr3 = '0x1234567890123456789012345678901234567891'
    
    expect(addressesEqual(addr1, addr2)).toBe(true)
    expect(addressesEqual(addr1, addr3)).toBe(false)
  })
})
