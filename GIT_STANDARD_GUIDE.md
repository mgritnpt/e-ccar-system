# คู่มือมาตรฐานการใช้งาน Git & Container Deployment (E-CCAR / E-NCR System)

เอกสารนี้รวบรวมมาตรฐานการใช้งาน Git และขั้นตอนการ Pull / Build ขึ้น Container เพื่อความเปนระเบียบ เสถียร และปลอดภัยของระบบ

---

## 1. การตั้งค่าระบบ Git บน เครื่อง Windows / Server

หากระบบแจ้งข้อความ `git : The term 'git' is not recognized...` แสดงว่ายังไม่ได้เพิ่ม Git เข้าไปใน System PATH ของ Windows สามารถรันคำสั่งโดยใช้ Path เต็มของ Git ได้ดังนี้:

### การเรียกใช้ผ่าน PowerShell / CMD
```powershell
& "C:\Program Files\Git\cmd\git.exe" status
```

### การตั้งค่า PATH แบบถาวร (ครั้งเดียว)
```powershell
[System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Git\cmd", [System.EnvironmentVariableTarget]::Machine)
```

---

## 2. มาตรฐานการ Commit (Conventional Commit Standard)

เพื่อให้ประวัติการแก้ไขใน Git อ่านง่ายและเป็นระเบียบ ให้ระบุประเภทของการเปลี่ยนแปลงนำหน้าเสมอ:

| Prefix | ความหมาย | ตัวอย่าง |
|---|---|---|
| `feat:` | เพิ่มฟีเจอร์ใหม่ | `feat: add user-defined master data management` |
| `fix:` | แก้ไขบัค / ปัญหา | `fix: resolve docker container build failure` |
| `docs:` | อัปเดตเอกสารคู่มือ | `docs: add git standard deployment guide` |
| `refactor:` | ปรับแต่งโครงสร้างโค้ดโดยไม่เปลี่ยนผลลัพธ์ | `refactor: extract dropdown options to helper` |
| `chore:` | งานบำรุงรักษา / ตั้งค่าคอนฟิก | `chore: update docker-compose and gitignore` |

---

## 3. ขั้นตอนการ Upload โค้ดไปยัง Git (Push Standard Flow)

ก่อนทำการ Upload ไปยัง Remote Repository ให้ทำตามขั้นตอนดังนี้เสมอ:

```bash
# 1. ตรวจสอบสถานะไฟล์ที่แก้ไข และไฟล์ที่ไม่ต้องการ
& "C:\Program Files\Git\cmd\git.exe" status

# 2. เพิ่มไฟล์ที่แก้ไขเข้า Staging Area
& "C:\Program Files\Git\cmd\git.exe" add .

# 3. Commit พร้อมข้อความมาตรฐาน
& "C:\Program Files\Git\cmd\git.exe" commit -m "feat: implement customizable master data fields and docker fix"

# 4. Push ไปยัง Remote repository (branch main)
& "C:\Program Files\Git\cmd\git.exe" push origin main
```

> [!CAUTION]
> **ข้อควรระวังเรื่องความปลอดภัย:**
> ห้าม commit ไฟล์ `.env`, รหัสผ่าน DB, หรือ `node_modules` ขึ้น Git เด็ดขาด (ไฟล์เหล่านี้ถูกละเว้นใน `.gitignore` เรียบร้อยแล้ว)

---

## 4. ขั้นตอนการดึงโค้ดลง Container (Container Deployment Flow)

เมื่อมีการ push โค้ดไปยัง Git และต้องการดึงลงเครื่อง Server / Container:

```bash
# 1. ดึงโค้ดล่าสุดจาก Git
& "C:\Program Files\Git\cmd\git.exe" pull origin main

# 2. สั่ง Rebuild และเริ่มรัน Container ใหม่แบบ Background Mode
docker compose up -d --build

# 3. ตรวจสอบสถานะ Container
docker compose ps

# 4. ตรวจสอบ Log การรันระบบ
docker compose logs -f app-eccar
```

---

## 5. สรุปพอร์ตและจุดเชื่อมต่อของระบบ

- **Frontend App & API Portal**: `http://localhost:8002` (หรือ IP Server พอร์ต 8002)
- **MariaDB Database (External Port)**: `localhost:3307`
- **Internal Database Port (Inside Docker Network)**: `db-eccar:3306`
