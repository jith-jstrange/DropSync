import { encrypt, decrypt } from '../src/utils/crypto';
describe('crypto', () => {
    it('roundtrips', () => {
        process.env.ENCRYPTION_KEY_HEX = '0'.repeat(64);
        const message = 'hello world';
        const out = encrypt(message);
        const txt = decrypt(out);
        expect(txt).toBe(message);
    });
});
