document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('ecommForm');
    const resultCard = document.getElementById('resultCard');
    const btnSubmit = document.getElementById('btnSubmit');
    const reviewInput = document.getElementById('reviewText');

    // Sample Review buttons
    window.setSampleReview = function(text) {
        reviewInput.value = text;
        reviewInput.focus();
    };

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!reviewInput.value.trim()) {
            alert('Vui lòng nhập văn bản đánh giá!');
            return;
        }

        const originalBtnText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<span class="spinner"></span> Đang phân tích Sentiment...';
        btnSubmit.disabled = true;

        try {
            const response = await fetch('/predict/ecomm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ review_text: reviewInput.value })
            });

            const res = await response.json();

            if (res.status === 'success') {
                resultCard.style.display = 'block';

                const badge = document.getElementById('resBadge');
                const title = document.getElementById('resTitle');
                const details = document.getElementById('resDetails');

                const probPercent = (res.probability * 100).toFixed(1);

                if (res.prediction === 1) {
                    badge.className = 'badge badge-success';
                    badge.textContent = 'RECOMMENDED (KHUYÊN DÙNG)';
                    title.textContent = 'Khách hàng rất hài lòng và sẵn sàng tiến cử sản phẩm!';
                    title.style.color = 'var(--success)';
                } else {
                    badge.className = 'badge badge-danger';
                    badge.textContent = 'NOT RECOMMENDED (KHÔNG KHUYÊN DÙNG)';
                    title.textContent = 'Đánh giá mang tính tiêu cực hoặc chưa hài lòng';
                    title.style.color = 'var(--danger)';
                }

                details.innerHTML = `
                    <strong>Phân tích từ mô hình NLP (TF-IDF + Classifier):</strong><br>
                    • Độ tin cậy dự đoán: <strong>${probPercent}%</strong><br>
                    • Độ dài văn bản: ${reviewInput.value.length} ký tự (${reviewInput.value.split(/\s+/).length} từ)<br>
                    <br>
                    <em>Trích đoạn đánh giá: "${reviewInput.value.substring(0, 150)}${reviewInput.value.length > 150 ? '...' : ''}"</em>
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
