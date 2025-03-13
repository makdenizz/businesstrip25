
const sheetURL = "https://opensheet.elk.sh/1-rcGC2o8phX7O_l_biwBoksBwdtnVsqMLqV7B4C_jNE/Sayfa1";

async function fetchData() {
    try {
        const response = await fetch(sheetURL);
        const data = await response.json();
        updateTable(data);
    } catch (error) {
        console.error("Google Sheets verileri çekilirken hata oluştu!", error);
    }
}

function updateTable(data) {
    const table = document.querySelector("table");
    table.innerHTML = `
        <tr>
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

    data.forEach(row => {
        if (displayedCount >= 8) return; // Maksimum 8 oturum göster

        const eventDateParts = row.Tarih.split(" "); // "15 Mart 2025"
        const eventDay = parseInt(eventDateParts[0]);
        const eventMonth = eventDateParts[1];
        const eventYear = parseInt(eventDateParts[2]);
        
        const eventTime = new Date(eventYear, getMonthNumber(eventMonth), eventDay);
        const [hours, minutes] = row.Saat.split(":"); // "10:00" formatını ayır
        eventTime.setHours(parseInt(hours), parseInt(minutes), 0);

        let statusClass = "yaklasiyor";
        let statusText = "YAKLAŞIYOR";

        const diff = eventTime - now;
        if (diff < 0) {
            if (sonlandiCount < 2) {
                statusClass = "sonlandi";
                statusText = "SONLANDI";
                sonlandiCount++;
            } else {
                return; // Eğer zaten 2 "SONLANDI" varsa bu etkinliği gösterme
            }
        } else if (diff < 10 * 60 * 1000) { // 10 dakika kaldıysa
            statusClass = "son-cagri";
            statusText = "SON ÇAĞRI";
        }

        table.innerHTML += `
            <tr>
                <td>${row.Tarih}</td>
                <td>${row.Saat}</td>
                <td>${row["Şirket/Konuk"]}</td>
                <td>${row["Oturum Türü"]}</td>
                <td>${row.Konum}</td>
                <td class="${statusClass}">${statusText}</td>
            </tr>
        `;
        
        displayedCount++; // Gösterilen etkinlik sayısını artır
    });
}

// Ay isimlerini sayıya çevirme fonksiyonu
function getMonthNumber(month) {
    const months = {
        "Ocak": 0, "Şubat": 1, "Mart": 2, "Nisan": 3, "Mayıs": 4, "Haziran": 5,
        "Temmuz": 6, "Ağustos": 7, "Eylül": 8, "Ekim": 9, "Kasım": 10, "Aralık": 11
    };
    return months[month] || 0;
}

setInterval(fetchData, 10000); // 30 saniyede bir güncelle
fetchData(); // İlk veriyi çek
