const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const expressionDiv = document.getElementById('expression');

let currentTint = ''; // 현재 적용된 틴트를 저장할 변수

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    setInterval(async () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;
            const highestExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            // 감정별 색상 정의
            const emotionColors = {
                anger: 'rgba(255, 0, 0, 0.3)',
                happy: 'rgba(255, 255, 0, 0.3)',
                sad: 'rgba(0, 0, 255, 0.3)',
                neutral: 'rgba(128, 128, 128, 0.3)',
                surprised: 'rgba(255, 165, 0, 0.3)',
                fear: 'rgba(128, 0, 128, 0.3)',
            };

            const newTint = emotionColors[highestExpression] || 'rgba(255, 255, 255, 0)';

            // 새로운 틴트가 기존 틴트와 다를 때만 업데이트
            if (newTint !== currentTint) {
                currentTint = newTint; // 현재 틴트를 업데이트
                canvas.style.backgroundColor = currentTint;
            }

            // 텍스트 업데이트 (페이드 효과)
            if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
        } else {
            if (expressionDiv.textContent !== 'No face detected') {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = 'No face detected';
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
            canvas.style.backgroundColor = 'rgba(255, 255, 255, 0)'; // 초기화 시 투명
            currentTint = ''; // 틴트 리셋
        }
    }, 500); // 더 긴 주기로 조정
});
