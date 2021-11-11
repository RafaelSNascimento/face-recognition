window.onload = async () => {
  // pegamos o elemento video onde aparecera a nossa imagem da webcam
  const videoEl = document.getElementsByTagName('video')[0];
  // pegamos o elemento canvas, onde vamos desenhar as notas detecções
  const canvasEl = document.getElementsByTagName('canvas')[0];
  // variável com o caminho onde os modelos estão localizados
  const MODEL_URL = '../models';

  // carregamos o modelo de detecção de faces
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  // carregamos o modelo de detecção das regiões faciais
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
  // carregamos o modelo de detecção de expressões
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  // carregamos o modelo de detecção de idade e genero
  await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);

  // esperamos o evento de play do video para iniciar as detecções
  videoEl.addEventListener("playing", () => {
    // iniciamos as detecções
    startDetectFaces(videoEl, canvasEl);
  });

  // solicitamos acesso a webcam do usuario
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: {} });

    // passamos o stream da webcam como source object do video
    videoEl.srcObject = stream;
  } catch(err) {
    console.log(err);
    alert('Falha ao carregar webcam, verifique suas permissões');
  }
}

startDetectFaces = (videoEl, canvasEl) => {
  // iniciamos um 'looping' com um intervalo de 100ms por ciclo
  setInterval(async () => {
    // realizamos as detecções
    const detections = await faceapi.detectSingleFace(
      videoEl, new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks(true).withFaceExpressions().withAgeAndGender();

    // se não detectamos nada, retornamos para não seguir com a lógica
    if (!detections) return;

    // redimensionamos os resultados para dar fit com o tamanho do canvas
    const resizedResults = faceapi.resizeResults(detections, { height: canvasEl.height, width: canvasEl.width });

    // limpamos o canvas
    canvasEl.getContext("2d").clearRect(0, 0, canvasEl.width, canvasEl.height);

    // desenhamos as marcações da face no canvas
    faceapi.draw.drawFaceLandmarks(canvasEl, resizedResults);

    // extraimos a idade, genero e expressão das detecções
    const { age, gender, expressions } = resizedResults;

    // escrevemos o resultado no canvas
    new faceapi.draw.DrawTextField(
      [
        `Gender: ${gender}`,
        `Age: ${parseInt(age)}`,
        `Expression: ${expressionAccuracy(expressions)}`,
      ],
      detections.detection.box.bottomLeft
    ).draw(canvasEl);
  }, 100);
};

expressionAccuracy = (expressions) => {
  return Object.keys(expressions).reduce((a, b) => (expressions[a] > expressions[b] ? a : b ));
};
