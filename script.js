

const sheetURL = "https://opensheet.elk.sh/1-rcGC2o8phX7O_l_biwBoksBwdtnVsqMLqV7B4C_jNE/Sayfa1";


// İlk veri çekme işlemi
fetchData();

// **Her 10 saniyede bir sadece "Durum" sütununu güncelle**
setInterval(updateStatusOnly, 10000);

// **Her 5 dakikada bir (300 saniyede bir) tabloyu tamamen yenile**
setInterval(fetchData, 10000);

// **Google Sheets'ten Veriyi Çek**
async function fetchData() {
    try {
        console.log("📡 Veri çekme işlemi başladı...");
        const response = await fetch(sheetURL);
        if (!response.ok) throw new Error("Google Sheets verileri alınamadı!");

        let data = await response.json();
        console.log("✅ Veri başarıyla çekildi:", data);

        data = cleanData(data);
        const selectedDate = findNextEventDate(data); // **Bugün veya en yakın etkinlik gününü bulana kadar devam et**

        if (!selectedDate) {
            console.warn("⚠️ Hiçbir etkinlik bulunamadı!");
            document.querySelector("table tbody").innerHTML = "<tr><td colspan='6'>Hiçbir etkinlik bulunamadı.</td></tr>";
            return;
        }

        data = data.filter(row => row.Tarih === selectedDate); // **Seçili günü filtrele**

        if (!document.querySelector("table tbody")) {
            populateTable(data);
        }
        updateStatusOnly();
    } catch (error) {
        console.error("⚠️ Hata oluştu:", error);
    }
}

// 📌 **Google Sheets’ten Gelen Veriyi Temizle**
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

// 📌 **Bugünün Etkinlikleri Yoksa Bir Sonraki Dolu Günü Bul (Tüm Boş Günleri Atlayarak Devam Et)**
function findNextEventDate(data) {
    let currentDate = new Date();

    while (true) {
        const todayString = `${currentDate.getDate()} ${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;
        const todayEvents = data.filter(row => row.Tarih === todayString);

        if (todayEvents.length > 0) {
            return todayString; // **Dolu bir gün bulundu, bu günü kullan**
        }

        // **Eğer bugünde etkinlik yoksa bir gün ileri git**
        currentDate.setDate(currentDate.getDate() + 1);

        // **Eğer gelecekte hiçbir etkinlik yoksa sonsuz döngüye girmemek için çık**
        if (currentDate.getFullYear() > new Date().getFullYear() + 1) {
            return null;
        }
    }
}

// 📌 **İlk Kez Tabloyu Doldur (Başlatma)**
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
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.Tarih}</td>
            <td>${row.Saat}</td>
            <td>${row["Şirket/Konuk"]}</td>
            <td>${row["Oturum Türü"]}</td>
            <td>${row.Konum}</td>
            <td class="durum-cell">YAKLAŞIYOR</td>
        `;
        tbody.appendChild(tr);
    });

    console.log("✅ Bugünün veya en yakın etkinlik gününün etkinlikleri gösteriliyor!");
}

// 📌 **Sadece "Durum" Sütununu Güncelle**
async function updateStatusOnly() {
    try {
        const response = await fetch(sheetURL);
        if (!response.ok) throw new Error("Google Sheets verileri alınamadı!");

        let data = await response.json();
        data = cleanData(data);
        const selectedDate = findNextEventDate(data); // **Seçili günü bul**
        data = data.filter(row => row.Tarih === selectedDate); // **Seçili günü filtrele**

        const now = new Date();

        // **Tablodaki satırları tara ve "Durum" sütununu güncelle**
        const rows = document.querySelectorAll("table tbody tr");
        rows.forEach(tr => {
            const cells = tr.children;
            if (cells.length < 6) return;

            const tarih = cells[0].innerText.trim();
            const saat = cells[1].innerText.trim();

            const eventDate = parseDate(tarih);
            const [hours, minutes] = saat.split(":");
            const eventTime = new Date(eventDate);
            eventTime.setHours(parseInt(hours), parseInt(minutes), 0);

            let statusText = "YAKLAŞIYOR";
            let statusClass = "yaklasiyor";

            const diff = eventTime - now;
            if (diff < 0) {
                statusText = "SONLANDI";
                statusClass = "sonlandi";
            } else if (diff < 10 * 60 * 1000) {
                statusText = "SON ÇAĞRI";
                statusClass = "son-cagri";
            }

            // **DOM Güncelleme (Sayfa Yenilenmeden)**
            requestAnimationFrame(() => {
                cells[5].innerHTML = `<span class="${statusClass}">${statusText}</span>`;
            });
        });

        console.log("✅ Seçili günün etkinlik durumu güncellendi!");
    } catch (error) {
        console.error("⚠️ Durum güncelleme hatası:", error);
    }
}

// 📌 **Tarih formatını `YYYY-MM-DD` olarak çevir**
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

// 📌 **Ay isimlerini getiren fonksiyon**
function getMonthName(monthIndex) {
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return months[monthIndex];
}
