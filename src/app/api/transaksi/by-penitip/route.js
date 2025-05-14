import pool from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - no token" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const id_penitip = decoded.id;

    const [rows] = await pool.query(
      `SELECT 
        t.id_transaksi,
        t.no_nota,
        t.tanggal_pesan,
        b.nama_barang,
        b.harga_barang,
        p.nama AS nama_pembeli,
        t.status_transaksi,
        k.komisi_penitip
      FROM transaksi t
      JOIN barang b ON b.id_transaksi = t.id_transaksi
      JOIN pembeli p ON t.id_pembeli = p.id_pembeli
      LEFT JOIN (
        SELECT DISTINCT id_transaksi, komisi_penitip
        FROM komisi
      ) k ON t.id_transaksi = k.id_transaksi
      WHERE b.id_penitip = ?
      ORDER BY t.tanggal_pesan DESC`,
      [id_penitip]
    );

    // Grouping berdasarkan id_transaksi
    const transaksiMap = new Map();

    for (const row of rows) {
      if (!transaksiMap.has(row.id_transaksi)) {
        transaksiMap.set(row.id_transaksi, {
          id_transaksi: row.id_transaksi,
          no_nota: row.no_nota,
          tanggal_pesan: row.tanggal_pesan,
          nama_pembeli: row.nama_pembeli,
          status_transaksi: row.status_transaksi,
          komisi_penitip: row.komisi_penitip,
          barang: [],
          total_harga: 0,
        });
      }

      const transaksi = transaksiMap.get(row.id_transaksi);

      const barangKey = `${row.nama_barang}-${row.harga_barang}`;
      const barangSudahAda = transaksi.barang.some(
        (b) => `${b.nama_barang}-${b.harga_barang}` === barangKey
      );

      if (!barangSudahAda) {
        transaksi.barang.push({
          nama_barang: row.nama_barang,
          harga_barang: row.harga_barang,
        });
        transaksi.total_harga += Number(row.harga_barang);
      }

      transaksi.total_harga += parseFloat(row.harga_barang || 0);
    }

    console.log(transaksiMap);

    return NextResponse.json(
      { transaksi: Array.from(transaksiMap.values()) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in /api/transaksi/by-penitip:", error);
    return NextResponse.json(
      { error: "Failed to fetch Penitip's Transaksi" },
      { status: 500 }
    );
  }
}
