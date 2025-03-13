

const sheetURL = "https://opensheet.elk.sh/1-rcGC2o8phX7O_l_biwBoksBwdtnVsqMLqV7B4C_jNE/Sayfa1";


// İlk veri çekme işlemi
fetchData();

// 30 saniyede bir veriyi güncelle
setInterval(fetchData, 30000);

async function fetchData() {
    try {
        console.log("📡 Veri çekme işlemi başladı...");
        const response = await fetch(sheetURL);
        if (!response.ok) throw new Error("Google Sheets verileri alınamadı!");

        let data = await response.json();
        console.log("✅ Veri başarıyla çekildi:", data);

        data = cleanData(data);
        if (!Array.isArray(data) || data.length === 0) {
            console.error("🚨 Hata: Google Sheets'ten gelen veri boş veya hatalı!");
            return;
        }

        if (!document.querySelector("table tbody")) {
            populateTable(data); // Eğer tablo hiç oluşturulmadıysa, baştan oluştur
        } else {
            updateStatus(data); // Sadece "Durum" sütununu güncelle
        }
    } catch (error) {
        console.error("⚠️ Hata oluştu:", error);
    }
}

// 📌 Google Sheets’ten Gelen Veriyi Temizle
function cleanData(data) {
    return data
        .map(row => {
            const keys = Object.keys(row);
            if (keys.includes("Tarih") || keys.includes("Saat")) {
                return row; 
            }

            return {
                "Tarih": row[keys[0]],
                "Saat": row[keys[1]],
                "Şirket/Konuk": row[keys[2]],
                "Oturum Türü": row[keys[3]],
                "Konum": row[keys[4]]
            };
        })
        .filter(row => row.Tarih && row.Saat && row["Şirket/Konuk"]);
}

// 📌 **Tabloyu İlk Kez Doldur (Sadece İlk Sefer)**
function populateTable(data) {
    const table = document.querySelector("table");
    if (!table) {
        console.error("🚨 Tablo bulunamadı!");
        return;
    }

    table.innerHTML = `
        <thead>
            <tr class="table-header">
                <th>Tarih</th>
                <th>Saat</th>
                <th>Şirket/Konuk</th>
                <th>Oturum Türü</th>
                <th>Konum</th>
                <th>Durum</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector("tbody");

    data.forEach(row => {
        const eventDate = parseDate(row.Tarih);
        const [hours, minutes] = row.Saat.split(":");
        const eventTime = new Date(eventDate);
        eventTime.setHours(parseInt(hours), parseInt(minutes), 0);

        let statusClass = "yaklasiyor";
        let statusText = "YAKLAŞIYOR";

        const now = new Date();
        const diff = eventTime - now;
        if (diff < 0) {
            statusClass = "sonlandi";
            statusText = "SONLANDI";
        } else if (diff < 10 * 60 * 1000) { 
            statusClass = "son-cagri";
            statusText = "SON ÇAĞRI";
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.Tarih}</td>
            <td>${row.Saat}</td>
            <td>${row["Şirket/Konuk"]}</td>
            <td>${row["Oturum Türü"]}</td>
            <td>${row.Konum}</td>
            <td class="${statusClass}">${statusText}</td>
        `;

        tbody.appendChild(tr);
    });

    console.log("✅ İlk tablo oluşturuldu!");
}

// 📌 **Sadece "Durum" Sütununu Güncelle**
function updateStatus(data) {
    const now = new Date();

    data.forEach(row => {
        const eventDate = parseDate(row.Tarih);
        const [hours, minutes] = row.Saat.split(":");
        const eventTime = new Date(eventDate);
        eventTime.setHours(parseInt(hours), parseInt(minutes), 0);

        let statusClass = "yaklasiyor";
        let statusText = "YAKLAŞIYOR";

        const diff = eventTime - now;
        if (diff < 0) {
            statusClass = "sonlandi";
            statusText = "SONLANDI";
        } else if (diff < 10 * 60 * 1000) { 
            statusClass = "son-cagri";
            statusText = "SON ÇAĞRI";
        }

        // **Tablodaki satırları güncelle**
        const rows = document.querySelectorAll("table tbody tr");
        rows.forEach(tr => {
            const cells = tr.children;
            if (cells.length > 5 && cells[1].innerText === row.Saat && cells[0].innerText === row.Tarih) {
                cells[5].innerText = statusText; // "Durum" sütununu güncelle
                cells[5].className = statusClass; // CSS sınıfını güncelle
            }
        });
    });

    console.log("✅ Durum sütunu güncellendi!");
}

// 📌 Tarih formatını `YYYY-MM-DD` olarak çeviren fonksiyon
function parseDate(dateString) {
    const months = {
        "Ocak": "01", "Şubat": "02", "Mart": "03", "Nisan": "04", "Mayıs": "05", "Haziran": "06",
        "Temmuz": "07", "Ağustos": "08", "Eylül": "09", "Ekim": "10", "Kasım": "11", "Aralık": "12"
    };

    const parts = dateString.split(" ");
    if (parts.length !== 3) {
        console.error("🚨 Yanlış tarih formatı:", dateString);
        return NaN;
    }

    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]];
    const year = parts[2];

    if (!month) {
        console.error("🚨 Geçersiz ay bilgisi:", dateString);
        return NaN;
    }

    return `${year}-${month}-${day}`;
}
