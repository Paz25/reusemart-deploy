import { registerUser } from '@/auth/emailVerification';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { nama, no_telepon, email, password } = await request.json();

        if (!nama || !no_telepon || !email || !password) {
            return NextResponse.json({ error: "All fields are required!" }, { status: 400 });
        }

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format!" }, { status: 400 });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json({
                error: "Password must be at least 8 characters long and include at least one number, one uppercase letter, and one lowercase letter."
            }, { status: 400 });
        }

        // Cek apakah email sudah ada di pegawai
        const [existingPegawai] = await pool.query("SELECT * FROM pegawai WHERE email = ?", [email]);
        if (existingPegawai.length > 0) {
            return NextResponse.json({ error: "Email already exists in Pegawai!" }, { status: 400 });
        }

        // Cek apakah email sudah ada di pembeli
        const [existingPembeli] = await pool.query("SELECT * FROM pembeli WHERE email = ?", [email]);
        if (existingPembeli.length > 0) {
            return NextResponse.json({ error: "Email already exists in Pembeli!" }, { status: 400 });
        }

        // Cek apakah email sudah ada di organisasi
        const [existingOrg] = await pool.query("SELECT * FROM organisasi WHERE email = ?", [email]);
        if (existingOrg.length > 0) {
            return NextResponse.json({ error: "Email already exists in Organisasi!" }, { status: 400 });
        }

        // Cek apakah email sudah ada di penitip
        const [existingPenitip] = await pool.query("SELECT * FROM penitip WHERE email = ?", [email]);
        if (existingPenitip.length > 0) {
            return NextResponse.json({ error: "Email already exists in Penitip!" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO pembeli (nama, no_telepon, email, password, poin_loyalitas, is_verified) VALUES (?, ?, ?, ?, ?, ?)",
            [nama, no_telepon, email, hashedPassword, 0, 0] 
        );

        const pembeliId = result.insertId; 

        await registerUser(email, pembeliId);

        return NextResponse.json({ message: "Registration successful. Please check your email to verify." }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to register pembeli: " + error.message }, { status: 500 });
    }
}