import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { verifyUserRole } from '@/lib/auth';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';

export async function GET(request) {
    try {
        await verifyUserRole(["CS"]);

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("q");

        let query = `
        SELECT penitip.id_penitip, penitip.id, penitip.nama, penitip.no_ktp, penitip.no_telepon, 
               penitip.email, penitip.badge_level,
               COUNT(barang.id_barang) AS total_barang
        FROM penitip
        LEFT JOIN barang ON penitip.id_penitip = barang.id_penitip
      `;

        let values = [];

        if (search) {
            query += `
          WHERE penitip.nama LIKE ? OR penitip.email LIKE ? OR penitip.no_telepon LIKE ?
        `;
            values = [`%${search}%`, `%${search}%`, `%${search}%`];
        }

        query += ` GROUP BY penitip.id_penitip`;

        const [penitip] = await pool.query(query, values);

        return NextResponse.json({ penitip }, { status: 200 });

    } catch (error) {
        if (error instanceof ForbiddenError) {
            return NextResponse.json({ error: "Anda tidak memiliki akses ke halaman ini" }, { status: 403 });
        }
        if (error instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Token tidak valid atau telah kedaluwarsa" }, { status: 401 });
        }

        console.error("Uncaught error:", error); // hanya log error sistem
        return NextResponse.json({ error: "Gagal mengambil data penitip" }, { status: 500 });
    }

}

export async function POST(request) {
    try {
        await verifyUserRole(["CS"]);

        const { nama, no_ktp, no_telepon, email, password } = await request.json();

        if (!nama || !no_ktp || !no_telepon || !email || !password) {
            return NextResponse.json({ error: "All fields are required!" }, { status: 400 });
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

        // Cek apakah email sudah ada di penitip
        const [existingPenitip] = await pool.query("SELECT * FROM penitip WHERE email = ? OR no_ktp = ?", [email, no_ktp]);
        if (existingPenitip.length > 0) {
            return NextResponse.json({ error: "Email or No KTP already exists in Penitip!" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO penitip (nama, no_ktp, no_telepon, email, password, badge_level) VALUES (?, ?, ?, ?, ?, ?)",
            [nama, no_ktp, no_telepon, email, hashedPassword, "novice"]
        );

        const id_penitip = result.insertId;
        const id = `T${id_penitip}`;

        await pool.query("UPDATE penitip SET id = ? WHERE id_penitip = ?", [id, id_penitip]);

        return NextResponse.json({ message: "Penitip added successfully!", id }, { status: 201 });

    } catch (error) {
        if (error instanceof ForbiddenError) {
            return NextResponse.json({ error: "Anda tidak memiliki akses ke halaman ini" }, { status: 403 });
        }
        if (error instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Token tidak valid atau telah kedaluwarsa" }, { status: 401 });
        }

        console.error("Failed to add Penitip:", error);
        return NextResponse.json({ error: "Failed to add Penitip" }, { status: 500 });
    }
}


export async function PUT(request) {
    try {
        await verifyUserRole(["CS"]);

        const { id_penitip, nama, no_ktp, no_telepon, email, badge_level } = await request.json();

        if (!id_penitip || !nama || !no_ktp || !no_telepon || !email || !badge_level) {
            return NextResponse.json({ error: "All fields are required!" }, { status: 400 });
        }

        const [penitipExists] = await pool.query("SELECT * FROM penitip WHERE id_penitip = ?", [id_penitip]);

        if (penitipExists.length === 0) {
            return NextResponse.json({ error: "Penitip not found!" }, { status: 404 });
        }

        await pool.query(
            "UPDATE penitip SET nama = ?, no_ktp = ?, no_telepon = ?, email = ?, badge_level = ? WHERE id_penitip = ?",
            [nama, BigInt(no_ktp), BigInt(no_telepon), email, badge_level, id_penitip]
        );

        return NextResponse.json({ message: "Penitip updated successfully!" }, { status: 200 });

    } catch (error) {
        if (error instanceof ForbiddenError) {
            return NextResponse.json({ error: "Anda tidak memiliki akses ke halaman ini" }, { status: 403 });
        }
        if (error instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Token tidak valid atau telah kedaluwarsa" }, { status: 401 });
        }

        console.error("Failed to update Penitip:", error);
        return NextResponse.json({ error: "Failed to update Penitip" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        await verifyUserRole(["CS"]);

        const { id_penitip } = await request.json();

        if (!id_penitip) {
            return NextResponse.json({ error: "id_penitip is required!" }, { status: 400 });
        }

        const [penitipExists] = await pool.query("SELECT * FROM penitip WHERE id_penitip = ?", [id_penitip]);

        if (penitipExists.length === 0) {
            return NextResponse.json({ error: "Penitip not found!" }, { status: 404 });
        }

        await pool.query("DELETE FROM penitip WHERE id_penitip = ?", [id_penitip]);

        return NextResponse.json({ message: "Penitip deleted successfully!" }, { status: 200 });

    } catch (error) {
        if (error instanceof ForbiddenError) {
            return NextResponse.json({ error: "Anda tidak memiliki akses ke halaman ini" }, { status: 403 });
        }
        if (error instanceof UnauthorizedError) {
            return NextResponse.json({ error: "Token tidak valid atau telah kedaluwarsa" }, { status: 401 });
        }

        console.error("Failed to delete Penitip:", error);
        return NextResponse.json({ error: "Failed to delete Penitip" }, { status: 500 });
    }
}
