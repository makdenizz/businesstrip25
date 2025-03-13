const sheetURL = "https://opensheet.elk.sh/1-rcGC2o8phX7O_l_biwBoksBwdtnVsqMLqV7B4C_jNE/Sayfa1";

const MAX_ETKINLIK = 8;

// İlk veri çekme işlemi
fetchData();

// **Her 10 saniyede bir sadece "Durum" sütununu güncelle**
setInterval(updateStatusOnly, 10000);

// **Her 5 dakikada bir tabloyu tamamen yenile**
setInterval(fetchData, 300000);

// **Google Sheets'ten Veriyi Çek**
async function fetchData() {
    try {
        console.log("📡 Veri çekme işlemi başladı...");
        const response = await fetch(sheetURL);

        if (!response.ok) {
            throw new Error(`Google Sheets verileri alınamadı! Hata Kodu: ${response.status}`);
        }

        let data = await response.json();
        console.log("✅ Veri başarıyla çekildi:", data);

        // **Veriyi temizle ve güncelle**
        data = cleanData(data);
        updateTable(data);
        updateMobileCards(data);
    } catch (error) {
        console.error("⚠️ Google Sheets verisi çekilemedi!", error);
    }
}

// 📌 **Google Sheets’ten Gelen Veriyi Temizle**
function cleanData(data) {
    return data.map(row => {
        return {
            "Tarih": row["Tarih"],
            "Saat": row["Saat"],
            "Şirket/Konuk": row["Şirket/Konuk"],
            "Oturum Türü": row["Oturum Türü"],
            "Konum": row["Konum"],
            "Durum": calculateStatus(row.Tarih, row.Saat) // **Durum bilgisi hesaplanıyor**
        };
    }).filter(row => row.Tarih && row.Saat && row["Şirket/Konuk"]);
}

// 📌 **Durum Bilgisini Hesapla (Tarih ve Saat Karşılaştırması)**
function calculateStatus(tarih, saat) {
    const eventDate = parseDate(tarih);
    const [hours, minutes] = saat.split(":").map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return "BİLİNMEYEN";

    const eventTime = new Date(eventDate);
    eventTime.setHours(hours, minutes, 0);

    const now = new Date();
    const diff = eventTime - now;

    if (diff < 0) {
        return "SONLANDI";
    } else if (diff < 10 * 60 * 1000) {
        return "SON ÇAĞRI";
    } else {
        return "YAKLAŞIYOR";
    }
}

// 📌 **Tabloyu Güncelle (Büyük Ekranlar için)**
function updateTable(data) {
    const tbody = document.querySelector("table tbody");
    tbody.innerHTML = "";

    data.slice(0, MAX_ETKINLIK).forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.Tarih}</td>
            <td>${row.Saat}</td>
            <td>${row["Şirket/Konuk"]}</td>
            <td>${row["Oturum Türü"]}</td>
            <td>${row.Konum}</td>
            <td class="durum-cell">${row.Durum}</td>
        `;
        tbody.appendChild(tr);
    });

    console.log("✅ Tablo güncellendi!");
}

// 📌 **Mobil İçin Kartları Güncelle**
function updateMobileCards(data) {
    const eventCards = document.querySelector(".event-cards");
    eventCards.innerHTML = "";

    data.slice(0, MAX_ETKINLIK).forEach(row => {
        const card = document.createElement("div");
        card.classList.add("event-card");

        card.innerHTML = `
            <div class="title">${row["Şirket/Konuk"]}</div>
            <div class="info">${row.Tarih} - ${row.Saat}</div>
            <div class="info">${row["Oturum Türü"]} @ ${row.Konum}</div>
            <div class="info durum-cell">${row.Durum}</div>
        `;

        eventCards.appendChild(card);
    });

    console.log("✅ Mobil kartlar güncellendi!");
}

// 📌 **Sadece "Durum" Sütununu Güncelle (Performans İçin)**
async function updateStatusOnly() {
    try {
        const response = await fetch(sheetURL);
        if (!response.ok) throw new Error("Google Sheets verileri alınamadı!");

        let data = await response.json();
        data = cleanData(data);

        // **Tablodaki satırları tara ve "Durum" sütununu güncelle**
        const rows = document.querySelectorAll("table tbody tr");
        rows.forEach((tr, index) => {
            const cells = tr.children;
            if (cells.length < 6) return;

            const statusText = data[index]?.Durum || "BİLİNMEYEN";
            requestAnimationFrame(() => {
                cells[5].innerHTML = `<span class="durum-cell">${statusText}</span>`;
            });
        });

        console.log("✅ Durum bilgileri güncellendi!");
    } catch (error) {
        console.error("⚠️ Durum güncelleme hatası:", error);
    }
}

// 📌 **Tarih Formatını `YYYY-MM-DD` olarak Çevir**
function parseDate(dateString) {
    const months = {
        "Ocak": "01", "Şubat": "02", "Mart": "03", "Nisan": "04", "Mayıs": "05", "Haziran": "06",
        "Temmuz": "07", "Ağustos": "08", "Eylül": "09", "Ekim": "10", "Kasım": "11", "Aralık": "12"
    };

    const parts = dateString.split(" ");
    if (parts.length !== 3) return NaN;

    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]];
    const year = parts[2];

    return `${year}-${month}-${day}`;
}
