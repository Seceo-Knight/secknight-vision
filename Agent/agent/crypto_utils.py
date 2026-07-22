"""
AES-256-CBC helpers matching the backend's PasswordEncoderDecoder exactly
(Backend/desktop/src/routes/v3/auth/services/password.service.js).

Wire format: "<ivHex>:<cipherHex>", key = the raw UTF-8 bytes of
CRYPTO_PASSWORD (must be exactly 32 bytes for aes-256-cbc), PKCS7 padding
(Node's crypto.createCipheriv default, matched here via pycryptodome's
Padding helpers).

This exact scheme is used for:
  - encrypting the login password before POSTing to /api/v3/auth/authenticate
  - the accessToken returned by that endpoint (opaque to us - we just store
    and replay it, never decrypt it ourselves)
"""

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import os


def _key_bytes(key: str) -> bytes:
    key_bytes = key.encode("utf-8")
    if len(key_bytes) != 32:
        raise ValueError(
            f"CRYPTO_PASSWORD must be exactly 32 bytes for aes-256-cbc, got {len(key_bytes)}"
        )
    return key_bytes


def encrypt(plaintext: str, key: str) -> str:
    key_bytes = _key_bytes(key)
    iv = os.urandom(16)
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
    padded = pad(plaintext.encode("utf-8"), AES.block_size)
    ciphertext = cipher.encrypt(padded)
    return f"{iv.hex()}:{ciphertext.hex()}"


def decrypt(token: str, key: str) -> str:
    key_bytes = _key_bytes(key)
    iv_hex, cipher_hex = token.split(":", 1)
    iv = bytes.fromhex(iv_hex)
    ciphertext = bytes.fromhex(cipher_hex)
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv)
    padded = cipher.decrypt(ciphertext)
    return unpad(padded, AES.block_size).decode("utf-8")
