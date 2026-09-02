document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('diabetesForm');
    const resultCard = document.getElementById('resultCard');
    const btnSubmit = document.getElementById('btnSubmit');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Show loading state
        const originalBtnText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<span class="spinner"></span> Đang xử lý chẩn đoán...';
        btnSubmit.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/predict/diabetes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const res = await response.json();

            if (res.status === 'success') {
                resultCard.style.display = 'block';
                
                const badge = document.getElementById('resBadge');
                const title = document.getElementById('resTitle');
                const prob = document.getElementById('resProbability');
                const details = document.getElementById('resDetails');

                const probabilityPercent = (res.probability * 100).toFixed(1);

                if (res.prediction === 1) {
                    badge.className = 'badge badge-danger';
                    badge.textContent = 'CẢNH BÁO: NGUY CƠ CAO';
                    title.textContent = 'Có dấu hiệu nguy cơ mắc bệnh tiểu đường';
                    title.style.color = 'var(--danger)';
                } else {
                    badge.className = 'badge badge-success';
                    badge.textContent = 'AN TOÀN: NGUY CƠ THẤP';
                    title.textContent = 'Chỉ số sức khỏe nằm trong giới hạn bình thường';
                    title.style.color = 'var(--success)';
                }

                prob.textContent = `${probabilityPercent}%`;

                details.innerHTML = `
                    <strong>Khuyên dùng từ mô hình:</strong><br>
                    • Tuổi: ${data.age} | BMI: ${data.bmi} kg/m²<br>
                    • Đường huyết: ${data.blood_glucose_level} mg/dL | Chỉ số HbA1c: ${data.HbA1c_level}%<br>
                    • Tiền sử hút thuốc: ${data.smoking_history}<br>
                    <br>
                    <em>${res.prediction === 1 ? 'Khuyên bạn nên đến cơ sở y tế gần nhất để kiểm tra đường huyết chuyên sâu và có chế độ ăn uống tập luyện hợp lý.' : 'Hãy tiếp tục duy trì chế độ sinh hoạt lành mạnh và kiểm tra sức khỏe định kỳ.'}</em>
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
