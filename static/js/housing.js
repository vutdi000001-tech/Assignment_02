document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('housingForm');
    const resultCard = document.getElementById('resultCard');
    const btnSubmit = document.getElementById('btnSubmit');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const originalBtnText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<span class="spinner"></span> Đang tính toán định giá...';
        btnSubmit.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/predict/housing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const res = await response.json();

            if (res.status === 'success') {
                resultCard.style.display = 'block';

                const priceEl = document.getElementById('resPrice');
                const detailsEl = document.getElementById('resDetails');

                const priceVal = res.price_billion;
                const area = parseFloat(data.Area) || 1;
                const pricePerM2 = (priceVal * 1000 / area).toFixed(1);

                priceEl.textContent = `${priceVal.toFixed(2)} Tỷ VNĐ`;

                detailsEl.innerHTML = `
                    <strong>Thông tin chi tiết bất động sản:</strong><br>
                    • Diện tích: ${data.Area} m² (Đơn giá ước tính: <strong>${pricePerM2} triệu VNĐ/m²</strong>)<br>
                    • Kết cấu: ${data.Bedrooms} phòng ngủ, ${data.Bathrooms} phòng tắm, ${data.Floors} tầng<br>
                    • Địa chỉ: ${data.Address}<br>
                    • Pháp lý: ${data.Legal_status} | Hướng: ${data.House_direction}<br>
                    <br>
                    <small>Khoảng giá ước lượng thị trường: <strong>${(priceVal * 0.92).toFixed(2)} - ${(priceVal * 1.08).toFixed(2)} Tỷ VNĐ</strong></small>
                `;

                resultCard.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert('Lỗi: ' + res.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Không thể kết nối đến máy chủ.');
        } finally {
            btnSubmit.innerHTML = originalBtnText;
            btnSubmit.disabled = false;
        }
    });
});
