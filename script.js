

const sheetURL = "https://opensheet.elk.sh/1-rcGC2o8phX7O_l_biwBoksBwdtnVsqMLqV7B4C_jNE/Sayfa1";


async function fetchData() {
    try {
        console.log("📡 Veri çekme işlemi başladı...");
        const response = await fetch(sheetURL);
        if (!response.ok) throw new Error("Google Sheets verileri alınamadı!");

        const data = await response.json();
        console.log("✅ Veri başarıyla çekildi:", data);

        // Veride hatalı veya eksik satırlar varsa log göster
        if (!Array.isArray(data) || data.length === 0) {
            console.error("🚨 Hata: Google Sheets'ten boş veya geçersiz veri geldi!");
            return;
        }

        updateTableWithAnimation(data);
    } catch (error) {
        console.error("⚠️ Hata oluştu:", error);
    }
}

function updateTableWithAnimation(data) {
    const table = document.querySelector("table");
    if (!table) {
        console.error("🚨 Tablo bulunamadı!");
        return;
    }

    table.innerHTML = `
        <tr class="table-header">
            <th>Tarih</th>
            <th>Saat</th>
            <th>Şirket/Konuk</th>
            <th>Oturum Türü</th>
            <th>Konum</th>
            <th>Durum</th>
        </tr>
    `;

    const now = new Date();
    let displayedCount = 0;
    let sonlandiCount = 0;

    data.forEach((row, index) => {
        if (displayedCount >= 8) return;

        // **Boş veya hatalı satırları atla**
        if (!row.Tarih || !row.Saat || !row["Şirket/Konuk"] || !row["Oturum Türü"] || !row.Konum) {
            console.warn(`⚠️ Eksik veri tespit edildi, atlanıyor: ${JSON.stringify(row)}`);
            return;
        }

        // Tarihi Date nesnesine çevir
        const eventDate = parseDate(row.Tarih);
        const [hours, minutes] = row.Saat.split(":");
        const eventTime = new Date(eventDate);
        eventTime.setHours(parseInt(hours), parseInt(minutes), 0);

        if (isNaN(eventTime.getTime())) {
            console.error("🚨 Hatalı tarih formatı:", row.Tarih, row.Saat);
            return;
        }

        let statusClass = "yaklasiyor";
        let statusText = "YAKLAŞIYOR";

        const diff = eventTime - now;
        if (diff < 0) {
            if (sonlandiCount < 2) {
                statusClass = "sonlandi";
                statusText = "SONLANDI";
                sonlandiCount++;
            } else {
                return;
            }
        } else if (diff < 10 * 60 * 1000) { 
            statusClass = "son-cagri";
            statusText = "SON ÇAĞRI";
        }

        const rowHTML = `
            <tr style="opacity:0; transform:translateX(-100%);" id="row-${index}">
                <td>${row.Tarih}</td>
                <td>${row.Saat}</td>
                <td>${row["Şirket/Konuk"]}</td>
                <td>${row["Oturum Türü"]}</td>
                <td>${row.Konum}</td>
                <td class="${statusClass}">${statusText}</td>
            </tr>
        `;

        table.innerHTML += rowHTML;
        displayedCount++;
    });

    // Satırları tek tek ekleyerek havaalanı efekti verelim
    let delay = 500; 
    data.forEach((_, index) => {
        setTimeout(() => {
            const row = document.getElementById(`row-${index}`);
            if (row) {
                row.style.opacity = "1";
                row.style.transform = "translateX(0)";
            }
        }, delay);
        delay += 200;
    });

    console.log("✅ Tablo güncellendi!");
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

setTimeout(fetchData, 1500);

