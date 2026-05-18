# HTTPS เปิดใช้งานแล้ว 🔒

S3 endpoint ของคุณพร้อมใช้งานบนโดเมนของคุณแล้ว

- **S3 endpoint:** `https://${this.externalDomain}/`
- **Addressing:** path-style เท่านั้น (force-path-style ฝั่ง client)
- ตัวอย่าง: `aws --endpoint-url https://${this.externalDomain} s3 ls`

ใบรับรองจะถูกต่ออายุอัตโนมัติโดย Let's Encrypt add-on หากต้องเปลี่ยนโดเมนหรือ re-issue กดปุ่ม **"Bind SSL / Issue Certificate"** ซ้ำได้ทุกเมื่อ

> ถ้า S3 ตอบ 403 / SignatureDoesNotMatch ให้ตรวจว่า client ตั้ง endpoint เป็นโดเมนนี้ตรงตัว และเปิด force-path-style
