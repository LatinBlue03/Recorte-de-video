let folderHandle = null;

document.getElementById('videoInput').addEventListener('change', function(event) {
    const videoFile = event.target.files[0];
    if (!videoFile) {
        alert('No se ha seleccionado ningún video.');
        return;
    }

    const videoUrl = URL.createObjectURL(videoFile);
    const videoElement = document.getElementById('video');
    videoElement.src = videoUrl;

    // Habilitar el botón de seleccionar carpeta
    document.getElementById('selectFolder').disabled = false;
    // Habilitar el botón de recorte
    document.getElementById('recortar').disabled = true;
});

document.getElementById('selectFolder').addEventListener('click', async () => {
    try {
        folderHandle = await window.showDirectoryPicker();
        alert('Carpeta seleccionada correctamente.');
        document.getElementById('recortar').disabled = false; // Habilitar recorte después de seleccionar carpeta
    } catch (err) {
        console.error(err);
        alert('Error al seleccionar la carpeta. Asegúrate de que tu navegador lo soporte.');
    }
});

document.getElementById('recortar').addEventListener('click', async function() {
    const videoElement = document.getElementById('video');
    const videoFile = document.getElementById('videoInput').files[0];
    if (!videoFile) {
        alert('Por favor, selecciona un video primero.');
        return;
    }
    if (!folderHandle) {
        alert('Por favor, selecciona una carpeta donde guardar los archivos.');
        return;
    }

    const duration = 90; // 90 segundos
    const totalDuration = Math.floor(videoElement.duration);
    let startTime = 0;

    // Procesar video en segmentos de 1:30
    while (startTime < totalDuration) {
        const endTime = Math.min(startTime + duration, totalDuration);
        await recortarVideo(videoFile, startTime, endTime, `video_${startTime}.mp4`);
        startTime += duration;
    }

    alert('Recorte completado.');
});

// Función para recortar video
async function recortarVideo(file, start, end, outputFileName) {
    const ffmpeg = FFmpeg.createFFmpeg({ log: true });
    await ffmpeg.load();

    ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

    // Comando para recortar el video
    await ffmpeg.run('-i', 'input.mp4', '-ss', start.toString(), '-t', (end - start).toString(), outputFileName);
    const data = ffmpeg.FS('readFile', outputFileName);

    // Crea un blob y guarda el video recortado en la carpeta seleccionada
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const fileHandle = await folderHandle.getFileHandle(outputFileName, { create: true });
    const writableStream = await fileHandle.createWritable();
    await writableStream.write(videoBlob);
    await writableStream.close();
}

// Función para obtener el archivo
async function fetchFile(file) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsArrayBuffer(file);
    });
}
