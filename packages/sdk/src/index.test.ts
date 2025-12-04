import { describe, it, expect } from 'vitest'
import { createSIWEMessage } from './index'

describe('createSIWEMessage', () => {
  it('should be defined', () => {
    expect(createSIWEMessage).toBeDefined()
  })

  it('should create a SIWE message with required params', () => {
    const message = createSIWEMessage({
      domain: 'example.com',
      address: '0x1234567890123456789012345678901234567890',
      uri: 'https://example.com',
      chainId: 1,
      nonce: 'abc123def456',
    })
    
    expect(message).toBeDefined()
    expect(message.domain).toBe('example.com')
    expect(message.address).toBe('0x1234567890123456789012345678901234567890')
    expect(message.chainId).toBe(1)
    expect(message.nonce).toBe('abc123def456')
    expect(message.version).toBe('1')
  })

  it('should generate issuedAt if not provided', () => {
    const message = createSIWEMessage({
      domain: 'example.com',
      address: '0x1234567890123456789012345678901234567890',
      uri: 'https://example.com',
      chainId: 1,
      nonce: 'abc123def456',
    })
    
    expect(message.issuedAt).toBeDefined()
    expect(new Date(message.issuedAt).toString()).not.toBe('Invalid Date')
  })
})
