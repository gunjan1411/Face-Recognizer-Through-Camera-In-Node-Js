const video = document.getElementById("video");
const detectedNamesDiv = document.getElementById("detectedNames");
let detectedUsers = new Set();

Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(startWebcam);

function startWebcam() {
    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: false,
        })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch((error) => {
            console.error(error);
        });
}

function getLabeledFaceDescriptions() {
    const labels = ["Gunjan","Aman","Sagar_Sir"];
    return Promise.all(
        labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(`./labels/${label}/${i}.jpg`);
                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                descriptions.push(detections.descriptor);
            }
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}

video.addEventListener("play", async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    const detectedNamesElement = document.getElementById("detectedNames");

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    // let name_arr = {};
    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const results = resizedDetections.map((d) => {
            return faceMatcher.findBestMatch(d.descriptor);
        });

        results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
                label: result,
            });
            drawBox.draw(canvas);
            detectedUsers.add(result.label);
        });

        detectedNamesDiv.innerHTML = '';
        detectedUsers.forEach((name)=>{
            detectedNamesDiv.innerHTML += `<h3>${name}<h3/>`; 
            
        })
    }, 100);
});

// Function to send detected names to the server
async function sendDetectedNames(names) {
    console.log(names);
    try {
        const response = await fetch('http://localhost:3001/saveDetectedNames', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ names })
        });
        const data = await response.json();
        console.log('Names sent successfully:', data);
    } catch (error) {
        console.error('Error sending names:', error);
    }
}   

// Add the following lines to send detected names to the server
setInterval(() => {
    sendDetectedNames(Array.from(detectedUsers));
}, 10000); 
