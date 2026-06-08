# Petwo MVP v0.1 PRD

## Product Overview

Petwo adalah aplikasi web sosial yang memungkinkan dua orang berbagi dunia virtual kecil bersama melalui hewan peliharaan virtual, aktivitas harian, dan interaksi ringan secara realtime.

Tagline:

"A little world for two."

Target awal:

* Pasangan
* Sahabat
* Keluarga
* Teman dekat

Platform:

* Web App (PWA)
* Mobile First
* Deploy di Vercel
* Backend Supabase

---

# Goals

Membuktikan bahwa dua orang mau membuka aplikasi setiap hari untuk merawat sesuatu bersama.

Success Criteria:

* User berhasil connect dengan user lain.
* User melakukan aktivitas harian.
* User kembali membuka aplikasi keesokan harinya.

---

# MVP Features

## 1. Authentication

User dapat:

* Login dengan Google
* Logout

Data:

* id
* name
* avatar_url
* email

---

## 2. Pair System

User dapat:

* Generate invite code
* Join menggunakan invite code
* Terhubung dengan satu user lain

Rules:

* 1 user hanya bisa memiliki 1 partner
* 1 room maksimal 2 user

Entity:

CoupleRoom

Fields:

* id
* invite_code
* owner_id
* partner_id
* created_at

---

## 3. Shared Pet

Setelah room terbentuk:

Sistem otomatis membuat 1 pet bersama.

Default:

Name:
Moci

Stats:

* Hunger
* Cleanliness
* Energy
* Happiness
* Level
* XP

Actions:

* Feed
* Bath
* Play
* Sleep

Semua action realtime.

Example:

Raffi klik Feed

↓

Pet hunger +10

↓

Cia langsung melihat perubahan tanpa refresh.

---

## 4. Activity Feed

Menampilkan aktivitas pasangan.

Examples:

Raffi fed Moci 🍖

Cia played with Moci 🎾

Raffi updated mood 😊

Realtime.

---

## 5. Daily Mood

Pilihan mood:

😊 Happy

😌 Chill

😴 Tired

😔 Sad

😤 Stressed

User dapat update 1 kali per hari.

Partner dapat melihat mood terbaru.

---

## 6. Shared Journal

User dapat:

* Membuat catatan
* Melihat catatan pasangan

Fields:

* id
* room_id
* author_id
* content
* created_at

Format:

Timeline sederhana.

---

## 7. Streak System

Streak bertambah jika dalam 1 hari terdapat minimal 1 aktivitas dari kedua user.

Aktivitas valid:

* Feed pet
* Bath pet
* Play pet
* Mood update
* Journal update

Fields:

* room_id
* streak_days
* last_active_date

---

## 8. Mini Game

Game MVP:

Truth or Dare

Flow:

* Klik Start
* Sistem random Truth
* Sistem random Dare

Tidak perlu realtime pada versi pertama.

---

# Realtime Events

Menggunakan Supabase Realtime.

Events:

pet_updated

activity_created

mood_updated

journal_created

streak_updated

---

# Database Tables

profiles

rooms

room_members

pets

pet_activities

moods

journals

streaks

---

# Pages

/auth

Login

/dashboard

Home

/pet

Pet Room

/journal

Shared Journal

/games

Truth or Dare

/settings

Settings

---

# UI Style

Theme:

* Cozy
* Cute
* Minimal
* Soft colors

Inspirasi:

* Finch
* Widgetable
* Animal Crossing

No dark cyberpunk.
No pink overload.

---

# Non Goals

Tidak termasuk:

* Voice Call
* Chat
* Photobooth
* Couple Home
* Multiplayer Games
* Push Notifications

Akan dibuat setelah MVP tervalidasi.

---

# Tech Stack

Frontend:
Next.js 15
TypeScript
Tailwind CSS
shadcn/ui

Backend:
Supabase

Hosting:
Vercel

Storage:
Supabase Storage

Realtime:
Supabase Realtime

PWA:
next-pwa

---

# Future Roadmap

V0.2

* Photobooth
* Album Memories
* Push Notification

V0.3

* Voice Room
* Tic Tac Toe Realtime

V0.4

* Virtual Home
* Furniture

V1.0

* Expo Mobile App
* Play Store Release

