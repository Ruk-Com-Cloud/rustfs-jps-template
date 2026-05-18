# RustFS S3 ติดตั้งสำเร็จ ✅ (เฟส 1 จาก 2)

บริการ RustFS S3 ของคุณทำงานแล้วบน **HTTP** ชั่วคราว ขั้นต่อไปคือผูกโดเมน + เปิด HTTPS

## ข้อมูลการเข้าถึง (ชั่วคราว)

- **S3 endpoint (ชั่วคราว):** `http://${nodes.bl.address}/`
- **Access Key:** `${globals.RUSTFS_ACCESS_KEY}`
- **Secret Key:** `${globals.RUSTFS_SECRET_KEY}`
- **Addressing:** ใช้ **path-style เท่านั้น** — ตั้ง client เป็น force-path-style
  (เช่น `aws --endpoint-url http://${nodes.bl.address} s3 ls`)

> ⚠️ เก็บ Secret Key ให้ปลอดภัย — จะไม่แสดงซ้ำ

## ขั้นตอนถัดไป — ผูกโดเมนและเปิด HTTPS

**1. Public IP ที่ได้รับ:** `${nodes.bl.extIPs}`

**2. สร้าง DNS record** ที่ผู้ให้บริการโดเมนของคุณ:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `${settings.externalDomain}` | `${nodes.bl.extIPs}` | 300 (ต่ำไว้ก่อนตอนตั้งครั้งแรก) |

**3. รอ DNS propagate** แล้วตรวจสอบ:
```
dig +short ${settings.externalDomain}
```
ต้องได้ค่าเท่ากับ `${nodes.bl.extIPs}`

**4. เปิดแท็บ Add-Ons ของ environment นี้ → กดปุ่ม "Bind SSL / Issue Certificate"**
ระบบจะตรวจ DNS, ออกใบรับรอง, แล้วสลับ endpoint เป็น
`https://${settings.externalDomain}/` ให้อัตโนมัติ (กดซ้ำได้ถ้า DNS ยังไม่ขึ้น)

---

ℹ️ ถ้าตอนติดตั้งเลือก **ไม่แนบ Public IP** หรือ **ไม่ใส่โดเมน** — endpoint ชั่วคราวด้านบนใช้งานได้เลย และสามารถตั้งค่า SSL/โดเมนภายหลังผ่านปุ่มเดียวกัน (จะใช้ Custom SSL via SLB + แนะนำให้ทำ CNAME แทน A record)

📚 คู่มืออัปเกรดเวอร์ชัน/rollback: ดู `README.md` ของ template — การเปลี่ยนเวอร์ชันทำผ่านปุ่ม **"Change Version"** (สำรองข้อมูลก่อนเสมอ ข้อมูลใน volume ถูกรักษาไว้)
