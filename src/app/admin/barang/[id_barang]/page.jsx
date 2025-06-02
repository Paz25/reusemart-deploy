"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReuseButton from "@/components/ReuseButton/ReuseButton";

export default function DetailBarangAdminPage() {
    const { id_barang } = useParams();
    const router = useRouter();

    const [barang, setBarang] = useState(null);
    const [previewImg, setPreviewImg] = useState("");
    const [uniqueImages, setUniqueImages] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [formData, setFormData] = useState({});
    const [previewImages, setPreviewImages] = useState([]);



    useEffect(() => {
        const fetchBarang = async () => {
            try {
                const res = await fetch(`/api/barang/${id_barang}`);
                const data = await res.json();
                setBarang(data.barang);

                if (data.barang && data.barang.gambar_barang.length > 0) {
                    setPreviewImg(data.barang.gambar_barang[0].src_img);
                    const uniqueImgs = Array.from(
                        new Set(data.barang.gambar_barang.map((item) => item.src_img))
                    ).map((src_img) =>
                        data.barang.gambar_barang.find((item) => item.src_img === src_img)
                    );
                    setUniqueImages(uniqueImgs);
                }
            } catch (err) {
                console.error("Gagal memuat barang:", err);
            }
        };

        fetchBarang();
    }, [id_barang]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(date);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1];

        const form = new FormData();
        form.append("nama_barang", formData.nama_barang);
        form.append("deskripsi_barang", formData.deskripsi_barang);
        form.append("harga_barang", formData.harga_barang);
        form.append("berat_barang", formData.berat_barang);
        form.append("tanggal_garansi", formData.tanggal_garansi);
        form.append("status_titip", "AVAILABLE");

        if (formData.gambar instanceof FileList) {
            Array.from(formData.gambar).forEach((file) => {
                form.append("gambar", file);
            });
        }

        const res = await fetch(`/api/barang/${id_barang}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` }, // jangan pasang Content-Type!
            body: form,
        });

        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (res.ok) {
            alert("Barang berhasil diupdate");
            setShowSidebar(false);
            router.refresh();
        } else {
            alert(data.error || "Gagal mengupdate barang");
        }
    };

    useEffect(() => {
        return () => {
            previewImages.forEach((src) => URL.revokeObjectURL(src));
        };
    }, [previewImages]);




    if (!barang) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            <button
                onClick={() => router.back()}
                className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
                Kembali
            </button>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <img
                        src={previewImg || "/images/default-image.jpg"}
                        alt={barang.nama_barang}
                        className="w-full h-[400px] object-cover rounded-xl mb-4"
                    />

                    <div className="flex gap-2">
                        {uniqueImages.map((gambar, index) => (
                            <img
                                key={index}
                                src={gambar.src_img}
                                onClick={() => setPreviewImg(gambar.src_img)}
                                className={`w-20 h-20 object-cover rounded cursor-pointer ${previewImg === gambar.src_img ? "ring-2 ring-indigo-600" : ""}`}
                            />
                        ))}
                    </div>

                    <div className="mt-4 flex justify-start gap-3">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFormData(barang); // ← inisialisasi form
                                setShowSidebar(true);
                            }}
                            className="w-28 rounded-full bg-gradient-to-r from-blue-800 to-blue-400 text-white font-semibold py-2 hover:opacity-90 transition"
                        >
                            Edit
                        </button>

                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                const confirmDelete = confirm("Yakin ingin menghapus barang ini?");
                                if (!confirmDelete) return;

                                const token = document.cookie
                                    .split("; ")
                                    .find((row) => row.startsWith("token="))
                                    ?.split("=")[1];

                                const res = await fetch("/api/barang", {
                                    method: "DELETE",
                                    headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ id_barang: barang.id_barang }),
                                });

                                const data = await res.json();
                                if (res.ok) {
                                    alert("Barang berhasil dihapus");
                                    setBarangList((prev) =>
                                        prev.filter((item) => item.id_barang !== barang.id_barang)
                                    );
                                } else {
                                    alert(data.error || "Gagal menghapus barang");
                                }
                            }}
                            className="w-28 rounded-full bg-gradient-to-r from-red-700 to-red-400 text-white font-semibold py-2 hover:opacity-90 transition"
                        >
                            Hapus
                        </button>
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl font-bold mb-2">{barang.nama_barang}</h1>
                    <p className="text-lg font-semibold text-indigo-700 mb-4">
                        Rp{parseInt(barang.harga_barang).toLocaleString("id-ID")}
                    </p>

                    <div className="grid gap-2 text-sm">
                        <p><strong>Kode Produk:</strong> {barang.kode_produk}</p>
                        <p><strong>Status Titip:</strong> {barang.status_titip}</p>
                        <p><strong>Garansi:</strong> {barang.tanggal_garansi ? formatDate(barang.tanggal_garansi) : '-'}</p>
                        <p><strong>Tanggal Masuk:</strong> {formatDate(barang.tanggal_masuk)}</p>
                        <p><strong>Tanggal Keluar:</strong> {barang.tanggal_keluar ? formatDate(barang.tanggal_keluar) : '-'}</p>
                        <p><strong>Penitip:</strong> {barang.id_penitip ? `P${barang.id_penitip} - ${barang.penitip_name}` : barang.penitip_name}</p>
                        <p><strong>Deskripsi:</strong></p>
                        <div className="text-sm whitespace-pre-line leading-relaxed">
                            {barang.deskripsi_barang || 'Tidak ada deskripsi.'}
                        </div>
                    </div>

                    {/* <div className="mt-6">
                        <h2 className="font-semibold mb-2">Deskripsi Barang</h2>
                        <p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded border">
                        {barang.deskripsi_barang || '-'}
                        </p>
                    </div> */}

                </div>
            </div>
            {showSidebar && (
                <>
                    {/* Overlay gelap */}
                    <div
                        className="fixed inset-0 z-40 bg-black opacity-20"
                        onClick={() => setShowSidebar(false)}
                    />

                    {/* Sidebar kanan */}
                    <div
                        className="fixed inset-y-0 right-0 z-50 bg-white w-3/5 h-full shadow-xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 font-semibold text-white text-sm bg-[radial-gradient(ellipse_130.87%_392.78%_at_121.67%_0.00%,_#26C2FF_0%,_#220593_90%)]">
                            <h2 className="text-lg">Edit Barang</h2>
                        </div>

                        <form className="flex flex-col gap-6 p-6" onSubmit={handleUpdate}>
                            {/* 1. Foto Barang */}
                            <input
                                type="file"
                                name="gambar"
                                multiple
                                onChange={(e) => {
                                    const files = e.target.files;
                                    setFormData({ ...formData, gambar: files });

                                    const previews = Array.from(files).map((file) => {
                                        return URL.createObjectURL(file);
                                    });

                                    setPreviewImages(previews);
                                }}
                                className="border px-3 py-2 rounded"
                            />

                            {/* Preview gambar baru */}
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {previewImages.map((src, idx) => (
                                    <img
                                        key={idx}
                                        src={src}
                                        alt={`Preview ${idx}`}
                                        className="w-24 h-24 object-cover rounded border"
                                    />
                                ))}
                            </div>

                            {/* 2. Nama Barang */}
                            <input
                                type="text"
                                name="nama_barang"
                                value={formData.nama_barang || ""}
                                onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                                className="border px-3 py-2 rounded"
                                placeholder="Nama Barang"
                            />

                            {/* 3. Harga Barang */}
                            <input
                                type="number"
                                name="harga_barang"
                                value={formData.harga_barang || ""}
                                onChange={(e) => setFormData({ ...formData, harga_barang: e.target.value })}
                                className="border px-3 py-2 rounded"
                                placeholder="Harga Barang"
                            />

                            {/* 4. Berat Barang */}
                            <input
                                type="number"
                                name="berat_barang"
                                value={formData.berat_barang || ""}
                                onChange={(e) => setFormData({ ...formData, berat_barang: e.target.value })}
                                className="border px-3 py-2 rounded"
                                placeholder="Berat (gram)"
                            />

                            {/* 5. Tanggal Garansi (jika kategori barang elektronik) */}
                            {barang?.kategori_barang?.includes("Elektronik") && (
                                <input
                                    type="date"
                                    name="tanggal_garansi"
                                    value={formData.tanggal_garansi?.split("T")[0] || ""}
                                    onChange={(e) => setFormData({ ...formData, tanggal_garansi: e.target.value })}
                                    className="border px-3 py-2 rounded"
                                />
                            )}

                            {/* 6. Deskripsi Barang */}
                            <textarea
                                name="deskripsi_barang"
                                value={formData.deskripsi_barang || ""}
                                onChange={(e) => setFormData({ ...formData, deskripsi_barang: e.target.value })}
                                className="border px-3 py-2 rounded"
                                placeholder="Deskripsi Barang"
                            />

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowSidebar(false)} className="px-4 py-2 bg-gray-200 rounded">
                                    Batal
                                </button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>

    );
}
